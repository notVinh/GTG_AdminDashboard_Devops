import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  RefreshCw,
  Eye,
  Package,
  CheckCircle,
  Calendar,
  Edit3,
  Truck,
  ExternalLink,
  Plus,
} from "lucide-react";
import { MisaSearchBar } from "../../components/commons/MisaSearchBar";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import {
  misaDataSourceApi,
  type MisaPuOrder,
  type MisaPuOrderDetail,
  PU_ORDER_STATUS,
} from "../../api/misa-data-source";
import { Pagination } from "../../components/commons/Pagination";
import { format, differenceInDays, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import PuOrderEditModal from "../../components/PuOrderEditModal";
import PuOrderConfirmArrivalModal from "../../components/PuOrderConfirmArrivalModal";
import ManualPurchaseOrderForm from "../../components/ManualPurchaseOrderForm";

export default function AdminPurchaseOrderManagement() {
  const navigate = useNavigate();

  // Purchase Orders state
  const [orders, setOrders] = useState<MisaPuOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Selected order and details
  const [selectedOrder, setSelectedOrder] = useState<MisaPuOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<MisaPuOrderDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MisaPuOrder | null>(null);
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format quantity
  const formatQuantity = (qty: number | string) => {
    const num = Number(qty);
    if (isNaN(num)) return "-";
    return parseFloat(num.toFixed(4)).toString();
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Get status badge (MISA status)
  const getStatusBadge = (status: number) => {
    const statusConfig = PU_ORDER_STATUS[status];
    if (!statusConfig)
      return <span className="text-gray-400 text-[11px]">{status}</span>;

    const colorClasses: Record<string, string> = {
      yellow: "bg-yellow-100 text-yellow-700",
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
    };

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[13px] font-medium ${
          colorClasses[statusConfig.color]
        }`}
      >
        {statusConfig.label}
      </span>
    );
  };

  // Get local status badge
  const getLocalStatusBadge = (localStatus: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      new: { label: "Mới", color: "bg-gray-100 text-gray-700" },
      waiting_goods: { label: "Chờ hàng về", color: "bg-yellow-100 text-yellow-700" },
      goods_arrived: { label: "Hàng đã về", color: "bg-green-100 text-green-700" },
    };

    const config = statusConfig[localStatus];
    if (!config)
      return <span className="text-gray-400 text-[11px]">{localStatus}</span>;

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[13px] font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Calculate days remaining until expected arrival
  const getDaysRemaining = (expectedDate: string | null) => {
    if (!expectedDate) return null;
    try {
      const expected = parseISO(expectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = differenceInDays(expected, today);
      return days;
    } catch {
      return null;
    }
  };

  // Get days remaining display
  const getDaysRemainingDisplay = (expectedDate: string | null) => {
    const days = getDaysRemaining(expectedDate);
    if (days === null) return null;

    if (days < 0) {
      return (
        <span className="text-red-600 font-medium text-[12px]">
          Quá {Math.abs(days)} ngày
        </span>
      );
    } else if (days === 0) {
      return (
        <span className="text-orange-600 font-medium text-[12px]">Hôm nay</span>
      );
    } else if (days <= 3) {
      return (
        <span className="text-orange-500 font-medium text-[12px]">
          Còn {days} ngày
        </span>
      );
    } else {
      return (
        <span className="text-green-600 font-medium text-[12px]">
          Còn {days} ngày
        </span>
      );
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await misaDataSourceApi.getPuOrders(
        page,
        limit,
        search || undefined
      );
      setOrders(result.data);
      setTotal(result.total);
      if (result.data.length > 0 && !selectedOrder) {
        setSelectedOrder(result.data[0]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  // Fetch order details when selected order changes
  const fetchOrderDetails = useCallback(async (orderId: number) => {
    setLoadingDetails(true);
    try {
      const result = await misaDataSourceApi.getPuOrderWithDetails(orderId);
      setOrderDetails(result.details);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setOrderDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetails(selectedOrder.id);
    }
  }, [selectedOrder, fetchOrderDetails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSyncOrders = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const dataSource = await misaDataSourceApi.getByCode("pu_order");
      if (!dataSource) {
        setSyncMessage({
          type: "error",
          text: 'Không tìm thấy nguồn dữ liệu đơn mua hàng. Vui lòng tạo data source với code "pu_order" trong trang Quản lý kết nối MISA.',
        });
        return;
      }
      const result = (await misaDataSourceApi.startSync(dataSource.id)) as any;
      if (result.success) {
        const stats = result.syncStats;
        let message = `Kéo ${result.total || 0} bản ghi`;
        if (stats) {
          message = `Tổng: ${result.total || 0} | Mới: ${
            stats.created
          } | Cập nhật: ${stats.updated} | Không đổi: ${stats.unchanged}`;
          if (stats.errors > 0) {
            message += ` | Lỗi: ${stats.errors}`;
          }
        }
        setSyncMessage({ type: "success", text: message });
        setPage(1);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        setSyncMessage({
          type: "error",
          text: result.message || "Kéo dữ liệu thất bại",
        });
      }
    } catch (error: any) {
      setSyncMessage({
        type: "error",
        text: error.message || "Có lỗi xảy ra khi kéo dữ liệu",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRowClick = (order: MisaPuOrder) => {
    setSelectedOrder(order);
  };

  // Open edit modal
  const handleOpenEditModal = (order: MisaPuOrder) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  // Open confirm arrival modal
  const handleOpenConfirmModal = (order: MisaPuOrder) => {
    setEditingOrder(order);
    setShowConfirmModal(true);
  };

  // Handle edit success
  const handleEditSuccess = (updatedOrder: MisaPuOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
    setSyncMessage({ type: "success", text: "Cập nhật thông tin thành công" });
  };

  // Handle confirm success
  const handleConfirmSuccess = (updatedOrder: MisaPuOrder, message: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
    setSyncMessage({ type: "success", text: message });
  };

  // Handle error
  const handleError = (message: string) => {
    setSyncMessage({ type: "error", text: message });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-3 flex-shrink-0">
        <button className="flex items-center gap-2 px-4 py-2 font-medium text-[13px] border-b-2 transition-colors border-blue-500 text-blue-600">
          <ShoppingBag className="w-4 h-4" />
          Đơn mua hàng
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <MisaSearchBar
              placeholder="Tìm theo số đơn, tên nhà cung cấp..."
              value={search}
              onChange={setSearch}
              onSearch={handleSearch}
              onRefresh={fetchOrders}
              onSync={handleSyncOrders}
              loading={loading}
              syncing={syncing}
              compact
            />
          </div>
          <button
            onClick={() => setShowManualOrderForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo đơn
          </button>
        </div>

        {/* Sync message */}
        {syncMessage && (
          <div className="flex-shrink-0">
            <div
              className={`px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-2 ${
                syncMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              <span className="flex-1">{syncMessage.text}</span>
              <button
                onClick={() => setSyncMessage(null)}
                className="font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Orders List - 63% */}
        <div
          className="bg-white rounded-lg border border-gray-200 flex flex-col min-h-0 overflow-hidden"
          style={{ height: "63%" }}
        >
          {/* Header with total */}
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <span className="text-[13px] font-medium text-gray-700">
              Tổng: <span className="text-blue-600 font-bold">{total}</span> đơn
              mua hàng
            </span>
          </div>

          <div className="overflow-x-auto flex-1 relative">
            <table
              className="w-full border-collapse table-fixed"
              style={{ minWidth: "1100px" }}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky left-0 top-0 bg-gray-50 z-30 border-r border-gray-200 w-[90px]">
                    Ngày tạo
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky left-[90px] top-0 bg-gray-50 z-30 border-r border-gray-200 w-[100px]">
                    Số đơn
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky left-[190px] top-0 bg-gray-50 z-30 border-r border-gray-200 w-[100px]">
                    Trạng thái
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[90px]">
                    Ngày về DK
                  </th>
                  <th className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[80px]">
                    Còn lại
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[180px]">
                    Nhà cung cấp
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[120px]">
                    Nhân viên
                  </th>
                  <th className="px-2 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[120px]">
                    Tổng đơn hàng
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[180px]">
                    Diễn giải
                  </th>
                  <th className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider sticky right-0 top-0 bg-gray-50 z-30 border-l border-gray-200 w-[50px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-1" />
                      <span className="text-[13px] text-gray-500">
                        Đang tải...
                      </span>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-[13px] text-gray-500">
                        Chưa có đơn mua hàng nào
                      </span>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const isCompleted = order.status === 3;
                    const isGoodsArrived =
                      order.localStatus === "goods_arrived";
                    const isWaitingGoods =
                      order.localStatus === "waiting_goods";
                    return (
                      <tr
                        key={order.id}
                        onClick={() => handleRowClick(order)}
                        className={`cursor-pointer group ${
                          isSelected
                            ? "bg-blue-50"
                            : isGoodsArrived
                            ? "bg-green-50 hover:bg-green-100"
                            : isWaitingGoods
                            ? "bg-yellow-50 hover:bg-yellow-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td
                          className={`px-2 py-1 text-[13px] border-r border-gray-200 sticky left-0 z-10 w-[90px] ${
                            isSelected
                              ? "bg-blue-50"
                              : isGoodsArrived
                              ? "bg-green-50 group-hover:bg-green-100"
                              : isWaitingGoods
                              ? "bg-yellow-50 group-hover:bg-yellow-100"
                              : "bg-white group-hover:bg-gray-50"
                          }`}
                        >
                          {formatDate(order.refDate)}
                        </td>
                        <td
                          className={`px-2 py-1 border-r border-gray-200 sticky left-[90px] z-10 w-[100px] ${
                            isSelected
                              ? "bg-blue-50"
                              : isGoodsArrived
                              ? "bg-green-50 group-hover:bg-green-100"
                              : isWaitingGoods
                              ? "bg-yellow-50 group-hover:bg-yellow-100"
                              : "bg-white group-hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-[13px] font-medium text-gray-900">
                            {order.refNo}
                          </div>
                          {order.saOrderRefNo && (
                            <div
                              className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/quan-ly/don-hang-misa/${order.saOrderId}`
                                );
                              }}
                              title={`Xem đơn bán hàng ${order.saOrderRefNo}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              ĐBH: {order.saOrderRefNo}
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-2 py-1 border-r border-gray-200 sticky left-[190px] z-10 w-[100px] ${
                            isSelected
                              ? "bg-blue-50"
                              : isGoodsArrived
                              ? "bg-green-50 group-hover:bg-green-100"
                              : isWaitingGoods
                              ? "bg-yellow-50 group-hover:bg-yellow-100"
                              : "bg-white group-hover:bg-gray-50"
                          }`}
                        >
                          {getLocalStatusBadge(order.localStatus)}
                        </td>
                        <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[90px]">
                          {order.expectedArrivalDate
                            ? formatDate(order.expectedArrivalDate)
                            : "-"}
                        </td>
                        <td className="px-2 py-1 text-center border-r border-gray-200 w-[80px]">
                          {order.localStatus === "waiting_goods" &&
                          order.expectedArrivalDate ? (
                            getDaysRemainingDisplay(order.expectedArrivalDate)
                          ) : order.localStatus === "goods_arrived" ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-1 border-r border-gray-200 w-[180px]">
                          <div className="text-[13px] text-gray-900 break-words">
                            {order.accountObjectName || "-"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {order.accountObjectCode || ""}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[120px] break-words">
                          {order.employeeName || "-"}
                        </td>
                        <td className="px-2 py-1 text-[13px] text-right border-r border-gray-200 w-[120px] font-medium text-blue-600">
                          {formatCurrency(order.totalOrderAmount)}
                        </td>
                        <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[180px] break-words">
                          {order.journalMemo || "-"}
                        </td>
                        <td
                          className={`px-2 py-1 text-center sticky right-0 z-10 border-l border-gray-200 w-[50px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                            isSelected
                              ? "bg-blue-50"
                              : isGoodsArrived
                              ? "bg-green-50 group-hover:bg-green-100"
                              : isWaitingGoods
                              ? "bg-yellow-50 group-hover:bg-yellow-100"
                              : "bg-white group-hover:bg-gray-50"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionsDropdown
                            actions={[
                              {
                                label: "Xem chi tiết",
                                icon: <Eye className="w-4 h-4" />,
                                onClick: () =>
                                  navigate(`/quan-ly/don-mua-hang/${order.id}`),
                              },
                              ...(order.localStatus !== "goods_arrived"
                                ? [
                                    {
                                      label: "Nhập thông tin",
                                      icon: <Edit3 className="w-4 h-4" />,
                                      onClick: () => handleOpenEditModal(order),
                                    },
                                  ]
                                : []),
                              ...(order.localStatus === "waiting_goods"
                                ? [
                                    {
                                      label: "Xác nhận hàng về",
                                      icon: <Truck className="w-4 h-4" />,
                                      onClick: () =>
                                        handleOpenConfirmModal(order),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200">
              <Pagination
                page={page}
                limit={limit}
                total={total}
                onPageChange={setPage}
                onLimitChange={handleLimitChange}
              />
            </div>
          )}
        </div>

        {/* Order Details - 35% */}
        <div
          className="bg-white rounded-lg border border-gray-200 flex flex-col min-h-0 overflow-hidden"
          style={{ height: "35%" }}
        >
          {selectedOrder ? (
            <>
              {/* Detail Header */}
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-[13px] font-medium text-gray-900">
                    Chi tiết:{" "}
                    <span className="text-blue-600">{selectedOrder.refNo}</span>
                  </span>
                  <span className="text-[12px] text-gray-500">
                    ({orderDetails.length} sản phẩm)
                  </span>
                  {getLocalStatusBadge(selectedOrder.localStatus)}
                </div>
                <div className="flex items-center gap-3 text-[12px] text-gray-500">
                  {selectedOrder.expectedArrivalDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Ngày về DK:{" "}
                        <span className="font-medium text-gray-700">
                          {formatDate(selectedOrder.expectedArrivalDate)}
                        </span>
                      </span>
                      {selectedOrder.localStatus === "waiting_goods" && (
                        <span className="ml-1">
                          (
                          {getDaysRemainingDisplay(
                            selectedOrder.expectedArrivalDate
                          )}
                          )
                        </span>
                      )}
                    </div>
                  )}
                  {selectedOrder.confirmedArrivalDate && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span>
                        Đã về:{" "}
                        <span className="font-medium text-green-700">
                          {formatDate(selectedOrder.confirmedArrivalDate)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-[11px] font-medium text-gray-500 uppercase w-[40px] border-r border-gray-200">
                        STT
                      </th>
                      <th className="px-2 py-1.5 text-left text-[11px] font-medium text-gray-500 uppercase w-[100px] border-r border-gray-200">
                        Mã SP
                      </th>
                      <th className="px-2 py-1.5 text-left text-[11px] font-medium text-gray-500 uppercase border-r border-gray-200">
                        Mô tả
                      </th>
                      <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[80px] border-r border-gray-200">
                        SL đặt
                      </th>
                      <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[80px] border-r border-gray-200">
                        SL nhận
                      </th>
                      <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[100px] border-r border-gray-200">
                        Đơn giá
                      </th>
                      <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[100px] border-r border-gray-200">
                        Thành tiền
                      </th>
                      <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[60px] border-r border-gray-200">
                        VAT%
                      </th>
                      <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[100px]">
                        Tiền VAT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingDetails ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 text-center">
                          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : orderDetails.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          Chưa có chi tiết sản phẩm
                        </td>
                      </tr>
                    ) : (
                      orderDetails.map((item, index) => (
                        <tr
                          key={item.id}
                          className={
                            item.isDescription
                              ? "bg-gray-50 italic"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-2 py-1 text-gray-500 border-r border-gray-200">
                            {index + 1}
                          </td>
                          <td className="px-2 py-1 font-medium border-r border-gray-200">
                            {item.inventoryItemCode || "-"}
                          </td>
                          <td className="px-2 py-1 text-gray-600 border-r border-gray-200">
                            {item.description || "-"}
                          </td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">
                            {item.isDescription
                              ? "-"
                              : formatQuantity(item.quantity)}
                          </td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">
                            {item.isDescription ? (
                              "-"
                            ) : (
                              <span
                                className={
                                  item.quantityReceipt >= item.quantity
                                    ? "text-green-600 font-medium"
                                    : "text-orange-600"
                                }
                              >
                                {formatQuantity(item.quantityReceipt)}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">
                            {item.isDescription
                              ? "-"
                              : formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-2 py-1 text-right font-medium border-r border-gray-200">
                            {item.isDescription
                              ? "-"
                              : formatCurrency(item.amountOc)}
                          </td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">
                            {item.isDescription ? "-" : `${item.vatRate}%`}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {item.isDescription
                              ? "-"
                              : formatCurrency(item.vatAmountOc)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {orderDetails.length > 0 && (
                    <tfoot className="bg-gray-50 sticky bottom-0">
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-1.5 text-right font-medium border-t border-gray-200"
                        >
                          Tổng cộng:
                        </td>
                        <td className="px-2 py-1.5 text-right font-bold text-blue-600 border-t border-gray-200">
                          {formatCurrency(
                            orderDetails.reduce((sum, item) => {
                              if (item.isDescription) return sum;
                              return sum + (Number(item.amountOc) || 0);
                            }, 0)
                          )}
                        </td>
                        <td className="px-2 py-1.5 border-t border-gray-200"></td>
                        <td className="px-2 py-1.5 text-right font-bold text-blue-600 border-t border-gray-200">
                          {formatCurrency(
                            orderDetails.reduce((sum, item) => {
                              if (item.isDescription) return sum;
                              return sum + (Number(item.vatAmountOc) || 0);
                            }, 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <span className="text-[13px]">
                  Chọn một đơn mua hàng để xem chi tiết sản phẩm
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <PuOrderEditModal
        open={showEditModal}
        order={editingOrder}
        onClose={() => {
          setShowEditModal(false);
          setEditingOrder(null);
        }}
        onSuccess={handleEditSuccess}
        onError={handleError}
      />

      {/* Confirm Arrival Modal */}
      <PuOrderConfirmArrivalModal
        open={showConfirmModal}
        order={editingOrder}
        onClose={() => {
          setShowConfirmModal(false);
          setEditingOrder(null);
        }}
        onSuccess={handleConfirmSuccess}
        onError={handleError}
      />

      {/* Manual Purchase Order Form */}
      <ManualPurchaseOrderForm
        isOpen={showManualOrderForm}
        onClose={() => setShowManualOrderForm(false)}
        onSuccess={() => {
          setPage(1);
          fetchOrders();
        }}
      />
    </div>
  );
}
