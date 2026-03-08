import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Truck,
  DollarSign,
  FileText,
  Building,
  X,
} from "lucide-react";
import { purchaseOrderApi } from "../../api/purchase-order";
import type { PurchaseOrder } from "../../types/purchase-order";
import { Button } from "../../components/ui/button";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { format } from "date-fns";

// Dialog component for approve with expected delivery date
interface ApproveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expectedDeliveryDate: string, notes?: string) => void;
  loading: boolean;
}

function ApproveDialog({ isOpen, onClose, onConfirm, loading }: ApproveDialogProps) {
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(expectedDeliveryDate, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          Nhập ngày dự kiến hàng về
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian hàng về dự kiến <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập ghi chú..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || !expectedDeliveryDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Chờ nhập ngày",
      className: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-4 w-4" />,
    },
    waiting: {
      label: "Chờ hàng về",
      className: "bg-blue-100 text-blue-800",
      icon: <Truck className="h-4 w-4" />,
    },
    received: {
      label: "Đã nhận hàng",
      className: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    completed: {
      label: "Hoàn thành",
      className: "bg-gray-100 text-gray-800",
      icon: <Package className="h-4 w-4" />,
    },
    cancelled: {
      label: "Đã hủy",
      className: "bg-red-100 text-red-800",
      icon: <XCircle className="h-4 w-4" />,
    },
  };

  const statusInfo = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full ${statusInfo.className}`}
    >
      {statusInfo.icon}
      {statusInfo.label}
    </span>
  );
};

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  // Load order
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await purchaseOrderApi.getById(Number(id));
        if (mounted) {
          setOrder(data);
        }
      } catch (err: any) {
        console.error("Error loading order:", err);
        if (mounted) {
          setError(err.message || "Không thể tải thông tin đơn mua hàng");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const reloadOrder = async () => {
    if (!order) return;
    try {
      const updatedOrder = await purchaseOrderApi.getById(order.id);
      setOrder(updatedOrder);
    } catch (err: any) {
      console.error("Error reloading order:", err);
    }
  };

  const handleConfirmExpectedDate = async (expectedDeliveryDate: string, notes?: string) => {
    if (!order) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.confirmExpectedDate(order.id, {
        expectedDeliveryDate,
        notes: notes || undefined,
      });
      toast.success("Nhập ngày dự kiến hàng về thành công!");
      setIsApproveDialogOpen(false);
      await reloadOrder();
    } catch (err: any) {
      console.error("Error confirming expected date:", err);
      toast.error(err.message || "Không thể nhập ngày dự kiến hàng về");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận đã nhận hàng",
      message: "Bạn có chắc đã nhận đủ hàng theo đơn mua hàng này?",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.confirmReceived(order.id, {});
      toast.success("Xác nhận nhận hàng thành công!");
      await reloadOrder();
    } catch (err: any) {
      console.error("Error confirming received:", err);
      toast.error(err.message || "Không thể xác nhận nhận hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận hoàn thành đơn mua hàng",
      message: "Bạn có chắc muốn hoàn thành đơn mua hàng này?",
      confirmText: "Hoàn thành",
      cancelText: "Hủy",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.updateStatus(order.id, { status: "completed" });
      toast.success("Hoàn thành đơn mua hàng thành công!");
      await reloadOrder();
    } catch (err: any) {
      console.error("Error completing order:", err);
      toast.error(err.message || "Không thể hoàn thành đơn mua hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận hủy đơn mua hàng",
      message: "Bạn có chắc muốn hủy đơn mua hàng này?",
      confirmText: "Hủy đơn",
      cancelText: "Quay lại",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.updateStatus(order.id, { status: "cancelled" });
      toast.success("Đã hủy đơn mua hàng!");
      await reloadOrder();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      toast.error(err.message || "Không thể hủy đơn mua hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận xóa đơn mua hàng",
      message: "Bạn có chắc muốn xóa đơn mua hàng này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseOrderApi.delete(order.id);
      toast.success("Xóa đơn mua hàng thành công!");
      navigate("/nha-may-cua-toi/purchase-orders");
    } catch (err: any) {
      console.error("Error deleting order:", err);
      toast.error(err.message || "Không thể xóa đơn mua hàng");
      setActionLoading(false);
    }
  };

  const getActionButtons = () => {
    if (!order) return null;

    const buttons = [];

    // Nút Nhập ngày dự kiến - chỉ hiện khi status là pending
    if (order.status === "pending") {
      buttons.push(
        <Button
          key="confirm-date"
          onClick={() => setIsApproveDialogOpen(true)}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Nhập ngày hàng về
        </Button>
      );
    }

    // Nút Xác nhận nhận hàng - chỉ hiện khi status là waiting
    if (order.status === "waiting") {
      buttons.push(
        <Button
          key="receive"
          onClick={handleConfirmReceived}
          disabled={actionLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Truck className="h-4 w-4 mr-2" />
          Xác nhận nhận hàng
        </Button>
      );
    }

    // Nút Hoàn thành - chỉ hiện khi status là received
    if (order.status === "received") {
      buttons.push(
        <Button
          key="complete"
          onClick={handleComplete}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Package className="h-4 w-4 mr-2" />
          Hoàn thành
        </Button>
      );
    }

    // Nút Hủy - chỉ hiện khi chưa hoàn thành hoặc chưa hủy
    if (!["completed", "cancelled"].includes(order.status)) {
      buttons.push(
        <Button
          key="cancel"
          onClick={handleCancel}
          disabled={actionLoading}
          variant="outline"
          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Hủy đơn
        </Button>
      );
    }

    // Nút Xóa - luôn hiện
    buttons.push(
      <Button
        key="delete"
        onClick={handleDelete}
        disabled={actionLoading}
        variant="outline"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Xóa
      </Button>
    );

    return buttons;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/nha-may-cua-toi/purchase-orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="text-center text-red-500">
          {error || "Không tìm thấy đơn mua hàng"}
        </div>
      </div>
    );
  }

  // Calculate total amount from items
  const totalAmount = order.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/nha-may-cua-toi/purchase-orders")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Đơn mua hàng {order.orderNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Ngày đặt: {order.orderDate ? format(new Date(order.orderDate), "dd/MM/yyyy") : "-"}
              </p>
            </div>
          </div>
          <div>{getStatusBadge(order.status)}</div>
        </div>

        {/* Action Buttons */}
        {getActionButtons() && getActionButtons()!.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            {getActionButtons()}
          </div>
        )}
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Thông tin nhà cung cấp
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Tên nhà cung cấp</div>
                <div className="font-medium">{order.supplierName || "-"}</div>
              </div>
            </div>
            {order.supplierPhone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Số điện thoại</div>
                  <div className="font-medium">{order.supplierPhone}</div>
                </div>
              </div>
            )}
            {order.supplierAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Địa chỉ</div>
                  <div className="font-medium">{order.supplierAddress}</div>
                </div>
              </div>
            )}
            {order.supplierTaxCode && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Mã số thuế</div>
                  <div className="font-medium">{order.supplierTaxCode}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Thông tin đơn hàng
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Số đơn hàng</div>
                <div className="font-medium">{order.orderNumber}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Ngày đặt hàng</div>
                <div className="font-medium">
                  {order.orderDate ? format(new Date(order.orderDate), "dd/MM/yyyy") : "-"}
                </div>
              </div>
            </div>
            {order.deliveryDate && (
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Ngày giao hàng dự kiến</div>
                  <div className="font-medium">
                    {format(new Date(order.deliveryDate), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
            )}
            {order.deliveryLocation && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Địa điểm giao hàng</div>
                  <div className="font-medium">{order.deliveryLocation}</div>
                </div>
              </div>
            )}
            {order.expectedDeliveryDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Thời gian hàng về dự kiến</div>
                  <div className="font-medium text-green-600">
                    {format(new Date(order.expectedDeliveryDate), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
            )}
            {totalAmount > 0 && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Tổng tiền</div>
                  <div className="font-bold text-lg text-green-600">
                    {totalAmount.toLocaleString("vi-VN")} VNĐ
                  </div>
                </div>
              </div>
            )}
            {order.createdBy && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Người tạo</div>
                  <div className="font-medium">
                    {order.createdBy?.user?.fullName || "-"}
                  </div>
                </div>
              </div>
            )}
            {order.confirmedBy && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Người nhập ngày dự kiến</div>
                  <div className="font-medium">
                    {order.confirmedBy?.user?.fullName || "-"}
                  </div>
                  {order.confirmedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(new Date(order.confirmedAt), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                </div>
              </div>
            )}
            {order.daysUntilDelivery !== undefined && order.daysUntilDelivery !== null && order.status === "waiting" && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Còn lại</div>
                  <div className={`font-bold text-lg ${order.daysUntilDelivery <= 0 ? 'text-red-600' : order.daysUntilDelivery <= 3 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {order.daysUntilDelivery <= 0 ? 'Đã đến hạn' : `${order.daysUntilDelivery} ngày`}
                  </div>
                </div>
              </div>
            )}
            {order.receivedBy && (
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Người nhận hàng</div>
                  <div className="font-medium">
                    {order.receivedBy?.user?.fullName || "-"}
                  </div>
                  {order.receivedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(new Date(order.receivedAt), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                </div>
              </div>
            )}
            {order.status === "completed" && order.completedBy && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Người hoàn thành</div>
                  <div className="font-medium">
                    {order.completedBy?.user?.fullName || "-"}
                  </div>
                  {order.completedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(new Date(order.completedAt), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {order.paymentTerms && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Điều khoản thanh toán
          </h2>
          <div className="text-gray-700">{order.paymentTerms}</div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ghi chú
          </h2>
          <div className="text-gray-700 whitespace-pre-wrap">{order.notes}</div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Danh sách sản phẩm ({order.items?.length || 0})
          </h2>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {order.items?.map((item, index) => (
            <div key={item.id || index} className="p-4 space-y-2">
              <div className="font-medium text-gray-900">{item.productName}</div>
              {item.productCode && (
                <div className="text-sm text-gray-500">Mã: {item.productCode}</div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Số lượng:</span>{" "}
                  <span className="font-medium">{item.quantity?.toLocaleString("vi-VN")}</span>
                </div>
                <div>
                  <span className="text-gray-500">ĐVT:</span>{" "}
                  <span className="font-medium">{item.unit || "-"}</span>
                </div>
                {item.unitPrice && (
                  <div>
                    <span className="text-gray-500">Đơn giá:</span>{" "}
                    <span className="font-medium">
                      {item.unitPrice.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                )}
                {item.totalPrice && (
                  <div>
                    <span className="text-gray-500">Thành tiền:</span>{" "}
                    <span className="font-medium">
                      {item.totalPrice.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ĐVT
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn giá
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.productCode || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.unit || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.quantity?.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.unitPrice ? `${item.unitPrice.toLocaleString("vi-VN")}` : "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {item.totalPrice ? `${item.totalPrice.toLocaleString("vi-VN")}` : "-"}
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              {order.items && order.items.length > 0 && totalAmount > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={6} className="px-4 py-4 text-sm text-gray-900 text-right">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                    {totalAmount.toLocaleString("vi-VN")} VNĐ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!order.items?.length && (
          <div className="p-8 text-center text-gray-500">
            Không có sản phẩm nào
          </div>
        )}
      </div>

      {/* Confirm Expected Date Dialog */}
      <ApproveDialog
        isOpen={isApproveDialogOpen}
        onClose={() => setIsApproveDialogOpen(false)}
        onConfirm={handleConfirmExpectedDate}
        loading={actionLoading}
      />
    </div>
  );
}
