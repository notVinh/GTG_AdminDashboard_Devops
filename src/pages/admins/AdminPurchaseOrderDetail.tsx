import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Calendar,
  Package,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  RefreshCw,
  Hash,
  Building,
  CreditCard,
  Percent,
} from "lucide-react";
import {
  misaDataSourceApi,
  type MisaPuOrder,
  type MisaPuOrderDetail,
  PU_ORDER_STATUS,
} from "../../api/misa-data-source";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminPurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<MisaPuOrder | null>(null);
  const [details, setDetails] = useState<MisaPuOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    const num = Number(amount);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  // Format quantity
  const formatQuantity = (qty: number | string) => {
    const num = Number(qty);
    if (isNaN(num)) return "-";
    return parseFloat(num.toFixed(4)).toString();
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Format datetime
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Get status badge (MISA status)
  const getStatusBadge = (status: number) => {
    const statusConfig = PU_ORDER_STATUS[status];
    if (!statusConfig) return <span className="text-gray-400">{status}</span>;

    const colorClasses: Record<string, string> = {
      yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
      blue: "bg-blue-100 text-blue-700 border-blue-300",
      green: "bg-green-100 text-green-700 border-green-300",
    };

    const iconMap: Record<string, React.ReactNode> = {
      yellow: <Clock className="w-4 h-4" />,
      blue: <RefreshCw className="w-4 h-4" />,
      green: <CheckCircle className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
          colorClasses[statusConfig.color]
        }`}
      >
        {iconMap[statusConfig.color]}
        {statusConfig.label}
      </span>
    );
  };

  // Get local status badge
  const getLocalStatusBadge = (localStatus: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      new: { label: "Mới", color: "bg-gray-100 text-gray-700 border-gray-300", icon: <Clock className="w-4 h-4" /> },
      waiting_goods: { label: "Chờ hàng về", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: <Clock className="w-4 h-4" /> },
      goods_arrived: { label: "Hàng đã về", color: "bg-green-100 text-green-700 border-green-300", icon: <CheckCircle className="w-4 h-4" /> },
    };

    const config = statusConfig[localStatus];
    if (!config) return <span className="text-gray-400">{localStatus}</span>;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await misaDataSourceApi.getPuOrderWithDetails(Number(id));
      setOrder(result.order);
      setDetails(result.details);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-600 mb-2">
          Không tìm thấy đơn mua hàng
        </h2>
        <button
          onClick={() => navigate("/quan-ly/don-mua-hang")}
          className="text-blue-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Calculate totals
  const totalAmount = details.reduce((sum, item) => {
    if (item.isDescription) return sum;
    return sum + (Number(item.amountOc) || 0);
  }, 0);

  const totalVat = details.reduce((sum, item) => {
    if (item.isDescription) return sum;
    return sum + (Number(item.vatAmountOc) || 0);
  }, 0);

  const totalQuantityOrdered = details.reduce((sum, item) => {
    if (item.isDescription) return sum;
    return sum + (Number(item.quantity) || 0);
  }, 0);

  const totalQuantityReceived = details.reduce((sum, item) => {
    if (item.isDescription) return sum;
    return sum + (Number(item.quantityReceipt) || 0);
  }, 0);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/quan-ly/don-mua-hang")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">{order.refNo}</h1>
            {getLocalStatusBadge(order.localStatus)}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 ml-9">
            Ngày tạo: {formatDate(order.refDate)}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Nhà cung cấp */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Building className="w-4 h-4 text-blue-600" />
            Nhà cung cấp
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Tên NCC</span>
              <p className="text-sm font-medium text-gray-900">
                {order.accountObjectName || "-"}
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-xs text-gray-500">Mã NCC</span>
                <p className="text-sm text-gray-700">
                  {order.accountObjectCode || "-"}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">MST</span>
                <p className="text-sm text-gray-700">
                  {order.accountObjectTaxCode || "-"}
                </p>
              </div>
            </div>
            {order.accountObjectAddress && (
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Địa chỉ
                </span>
                <p className="text-sm text-gray-700">
                  {order.accountObjectAddress}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin chung */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-green-600" />
            Thông tin chung
          </h3>
          <div className="space-y-2">
            <div className="flex gap-4">
              <div>
                <span className="text-xs text-gray-500">Số đơn</span>
                <p className="text-sm font-medium text-gray-900">
                  {order.refNo}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày đơn</span>
                <p className="text-sm text-gray-700">
                  {formatDate(order.refDate)}
                </p>
              </div>
            </div>
            {order.employeeName && (
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <User className="w-3 h-3" /> Nhân viên phụ trách
                </span>
                <p className="text-sm text-gray-700">{order.employeeName}</p>
              </div>
            )}
            {order.journalMemo && (
              <div>
                <span className="text-xs text-gray-500">Diễn giải</span>
                <p className="text-sm text-gray-700">{order.journalMemo}</p>
              </div>
            )}
            {order.branchName && (
              <div>
                <span className="text-xs text-gray-500">Chi nhánh</span>
                <p className="text-sm text-gray-700">{order.branchName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-orange-600" />
            Thông tin thanh toán
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Tiền hàng</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Thuế VAT</span>
              <span className="text-sm text-gray-700">
                {formatCurrency(order.totalVatAmount)}
              </span>
            </div>
            {order.totalDiscountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Chiết khấu</span>
                <span className="text-sm text-red-600">
                  -{formatCurrency(order.totalDiscountAmount)}
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Tổng đơn hàng
              </span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(order.totalOrderAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Đã thực hiện</span>
              <span
                className={`text-sm font-medium ${
                  order.alreadyDoneAmount >= order.totalOrderAmount
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {formatCurrency(order.alreadyDoneAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-gray-500">Tổng SL đặt</span>
              <p className="text-lg font-bold text-gray-900">
                {formatQuantity(totalQuantityOrdered)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tổng SL nhận</span>
              <p
                className={`text-lg font-bold ${
                  totalQuantityReceived >= totalQuantityOrdered
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {formatQuantity(totalQuantityReceived)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tiến độ</span>
              <p
                className={`text-lg font-bold ${
                  totalQuantityReceived >= totalQuantityOrdered
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {totalQuantityOrdered > 0
                  ? Math.round(
                      (totalQuantityReceived / totalQuantityOrdered) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết sản phẩm */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Chi tiết sản phẩm
            <span className="text-xs font-normal text-gray-500">
              ({details.length} dòng)
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[50px]">
                  STT
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">
                  Mã SP
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Mô tả
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[80px]">
                  ĐVT
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[100px]">
                  SL đặt
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[100px]">
                  SL nhận
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[120px]">
                  Đơn giá
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[120px]">
                  Thành tiền
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[70px]">
                  VAT%
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[110px]">
                  Tiền VAT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {details.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Chưa có chi tiết sản phẩm
                  </td>
                </tr>
              ) : (
                details.map((item, index) => (
                  <tr
                    key={item.id}
                    className={
                      item.isDescription
                        ? "bg-gray-50 italic"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {item.inventoryItemCode || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.description || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {item.unitName || "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.isDescription ? "-" : formatQuantity(item.quantity)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.isDescription ? (
                        "-"
                      ) : (
                        <span
                          className={
                            Number(item.quantityReceipt) >=
                            Number(item.quantity)
                              ? "text-green-600 font-medium"
                              : "text-orange-600"
                          }
                        >
                          {formatQuantity(item.quantityReceipt)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.isDescription
                        ? "-"
                        : formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {item.isDescription ? "-" : formatCurrency(item.amountOc)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {item.isDescription ? "-" : `${item.vatRate}%`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.isDescription
                        ? "-"
                        : formatCurrency(item.vatAmountOc)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {details.length > 0 && (
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right font-medium">
                    Tổng cộng:
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {formatQuantity(totalQuantityOrdered)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-green-600">
                    {formatQuantity(totalQuantityReceived)}
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-bold text-blue-600">
                    {formatCurrency(totalVat)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
        <div>
          Tạo bởi: {order.createdBy || "-"} | Cập nhật:{" "}
          {order.modifiedBy || "-"}
        </div>
        <div>
          Ngày tạo MISA: {formatDateTime(order.misaCreatedDate)} | Cập nhật:{" "}
          {formatDateTime(order.misaModifiedDate)}
        </div>
      </div>
    </div>
  );
}
