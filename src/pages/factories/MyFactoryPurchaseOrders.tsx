import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  User,
} from "lucide-react";
import { purchaseOrderApi } from "../../api/purchase-order";
import type { PurchaseOrder } from "../../types/purchase-order";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import MonthNavigation from "../../components/commons/MonthNavigation";
import Pagination from "../../components/commons/Pagination";
import { format } from "date-fns";

const STATUS_MAP = {
  pending: {
    label: "Chờ nhập ngày",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  waiting: {
    label: "Chờ hàng về",
    color: "text-blue-600 bg-blue-50",
    icon: Truck,
  },
  received: {
    label: "Đã nhận hàng",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  },
  completed: {
    label: "Hoàn thành",
    color: "text-gray-600 bg-gray-50",
    icon: Package,
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-red-600 bg-red-50",
    icon: XCircle,
  },
};

export default function MyFactoryPurchaseOrders() {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch orders with server-side filters
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!startDate || !endDate) return;

      try {
        setLoading(true);
        const query: any = {
          page,
          limit,
          startDate,
          endDate,
        };

        if (statusFilter) {
          query.status = statusFilter;
        }

        const result = await purchaseOrderApi.getAll(query);

        if (isMounted) {
          // Handle both formats: direct array or { data, meta } object
          if (Array.isArray(result)) {
            // Direct array response
            setOrders(result);
            setTotal(result.length);
          } else {
            // Object with data and meta
            setOrders(result?.data || []);
            setTotal(result?.meta?.total || 0);
          }
        }
      } catch (error: any) {
        console.error("Error fetching purchase orders:", error);
        if (isMounted) {
          toast?.error("Không thể tải danh sách đơn mua hàng");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [page, limit, statusFilter, startDate, endDate]);

  const handleConfirmReceived = async (orderId: number) => {
    const confirmed = await confirm({
      title: "Xác nhận đã nhận hàng",
      message: "Bạn có chắc đã nhận đủ hàng theo đơn mua hàng này?",
      confirmText: "Xác nhận",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.confirmReceived(orderId, {});
      toast.success("Đã xác nhận nhận hàng");

      // Refresh list
      const query: any = { page, limit };
      if (statusFilter) query.status = statusFilter;
      const result = await purchaseOrderApi.getAll(query);
      setOrders(result?.data || []);
      setTotal(result?.meta?.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Không thể xác nhận");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (orderId: number) => {
    const confirmed = await confirm({
      title: "Xác nhận hoàn thành",
      message: "Bạn có chắc muốn hoàn thành đơn mua hàng này?",
      confirmText: "Hoàn thành",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.updateStatus(orderId, { status: "completed" });
      toast.success("Đã hoàn thành đơn mua hàng");

      // Refresh list
      const query: any = { page, limit };
      if (statusFilter) query.status = statusFilter;
      const result = await purchaseOrderApi.getAll(query);
      setOrders(result?.data || []);
      setTotal(result?.meta?.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Không thể hoàn thành đơn");
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side search filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const orderNumber = order.orderNumber.toLowerCase();
        const supplierName = order.supplierName?.toLowerCase() || "";
        return orderNumber.includes(search) || supplierName.includes(search);
      }
      return true;
    });
  }, [orders, searchTerm]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, selectedMonth, selectedYear, startDate, endDate, limit]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "" || searchTerm.trim() !== "";

  // Month navigation handlers
  const handlePrevMonth = () => {
    setStartDate("");
    setEndDate("");

    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setStartDate("");
    setEndDate("");

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const loadOrders = async () => {
    if (!startDate || !endDate) return;

    try {
      const query: any = {
        page,
        limit,
        startDate,
        endDate,
      };

      if (statusFilter) query.status = statusFilter;

      const result = await purchaseOrderApi.getAll(query);

      if (Array.isArray(result)) {
        setOrders(result);
        setTotal(result.length);
      } else {
        setOrders(result?.data || []);
        setTotal(result?.meta?.total || 0);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
      setTotal(0);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP];
    if (!statusInfo) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {status}
        </span>
      );
    }

    const StatusIcon = statusInfo.icon;
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      waiting: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status] || "bg-gray-100 text-gray-800"}`}>
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </span>
    );
  };

  const getActions = (order: PurchaseOrder) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => navigate(`/nha-may-cua-toi/purchase-orders/${order.id}`),
      },
    ];

    // Với status pending, chuyển tới trang detail để nhập ngày
    // Không có action trực tiếp từ list nữa

    if (order.status === "waiting") {
      actions.push({
        label: "Xác nhận nhận hàng",
        icon: <Truck className="h-4 w-4" />,
        onClick: () => handleConfirmReceived(order.id),
      });
    }

    if (order.status === "received") {
      actions.push({
        label: "Hoàn thành",
        icon: <Package className="h-4 w-4" />,
        onClick: () => handleComplete(order.id),
      });
    }

    return actions;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Đơn mua hàng</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Quản lý đơn mua hàng từ nhà cung cấp
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "", label: "Tất cả trạng thái" },
                { value: "pending", label: "Chờ nhập ngày" },
                { value: "waiting", label: "Chờ hàng về" },
                { value: "received", label: "Đã nhận hàng" },
                { value: "completed", label: "Hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
          ]}
          gridCols="sm:grid-cols-2"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập số đơn hoặc tên nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(() => {
          const totalOrders = filteredOrders.length;
          const pendingCount = filteredOrders.filter(
            (o) => o.status === "pending"
          ).length;
          const waitingCount = filteredOrders.filter(
            (o) => o.status === "waiting"
          ).length;
          const completedCount = filteredOrders.filter(
            (o) => o.status === "completed"
          ).length;
          return (
            <>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <div className="text-sm text-gray-500">Tổng đơn hàng</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{pendingCount}</div>
                    <div className="text-sm text-gray-500">Chờ nhập ngày</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{waitingCount}</div>
                    <div className="text-sm text-gray-500">Chờ hàng về</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{completedCount}</div>
                    <div className="text-sm text-gray-500">Hoàn thành</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">
            Danh sách đơn mua hàng
          </h2>
          <MonthNavigation
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm">Đang tải...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm">
              Không có đơn mua hàng nào trong tháng {selectedMonth + 1} năm {selectedYear}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 space-y-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/nha-may-cua-toi/purchase-orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 mb-2">
                      <span className="font-bold text-blue-600 text-base">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Nhà cung cấp:</span>{" "}
                          <span className="text-gray-900 font-medium">{order.supplierName}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Ngày đặt:</span>{" "}
                          <span className="text-gray-900">
                            {order.orderDate
                              ? format(new Date(order.orderDate), "dd/MM/yyyy")
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <ActionsDropdown actions={getActions(order)} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số đơn
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    Không có đơn mua hàng nào trong tháng {selectedMonth + 1} năm {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/nha-may-cua-toi/purchase-orders/${order.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{order.supplierName}</div>
                        {order.supplierPhone && (
                          <div className="text-xs text-gray-500">{order.supplierPhone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderDate
                        ? format(new Date(order.orderDate), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[200px]">
                        {getStatusBadge(order.status)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <ActionsDropdown actions={getActions(order)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </div>
  );
}
