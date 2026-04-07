import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building,
  X,
  ShoppingCart,
} from "lucide-react";
import { purchaseRequisitionApi } from "../../api/purchase-requisition";
import {
  misaDataSourceApi,
  type MisaSaOrderDetail,
} from "../../api/misa-data-source";
import type { PurchaseRequisition } from "../../types/purchase-requisition";
import { Button } from "../../components/ui/button";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { format } from "date-fns";

// Dialog component for reject
interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: RejectDialogProps) {
  const [reason, setReason] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
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
          <XCircle className="h-5 w-5 text-red-600" />
          Từ chối đề xuất mua hàng
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập lý do từ chối..."
              required
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
              disabled={loading || !reason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Đang xử lý..." : "Từ chối"}
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
      label: "Chờ duyệt",
      className: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-4 w-4" />,
    },
    approved: {
      label: "Đã duyệt",
      className: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    rejected: {
      label: "Từ chối",
      className: "bg-red-100 text-red-800",
      icon: <XCircle className="h-4 w-4" />,
    },
    revision_required: {
      label: "Cần chỉnh sửa",
      className: "bg-purple-100 text-purple-800",
      icon: <Clock className="h-4 w-4" />,
    },
    purchase_confirmed: {
      label: "Đã mua hàng",
      className: "bg-blue-100 text-blue-800",
      icon: <ShoppingCart className="h-4 w-4" />,
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

export default function AdminPurchaseRequisitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(
    null,
  );
  const [saOrderDetails, setSaOrderDetails] = useState<MisaSaOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Load requisition
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await purchaseRequisitionApi.getById(Number(id));
        if (mounted) {
          setRequisition(data);

          // If has misaSaOrderId, load order details
          if (data.misaSaOrderId) {
            try {
              const orderData = await misaDataSourceApi.getSaOrderWithDetails(
                data.misaSaOrderId,
              );
              if (orderData.details) {
                setSaOrderDetails(orderData.details);
              }
            } catch (err) {
              console.error("Error loading MisaSaOrder details:", err);
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading requisition:", err);
        if (mounted) {
          setError(err.message || "Không thể tải thông tin đề xuất mua hàng");
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

  const reloadRequisition = async () => {
    if (!requisition) return;
    try {
      const updated = await purchaseRequisitionApi.getById(requisition.id);
      setRequisition(updated);
    } catch (err: any) {
      console.error("Error reloading requisition:", err);
    }
  };

  const handleApprove = async () => {
    if (!requisition) return;

    const confirmed = await confirm({
      title: "Xác nhận duyệt đề xuất",
      message:
        "Bạn có chắc muốn duyệt đề xuất mua hàng này? Sau khi duyệt, những người có quyền tạo đơn mua hàng sẽ nhận được thông báo.",
      confirmText: "Duyệt",
      cancelText: "Hủy",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseRequisitionApi.approve(requisition.id, {});
      toast.success("Duyệt đề xuất mua hàng thành công!");
      await reloadRequisition();
    } catch (err: any) {
      console.error("Error approving requisition:", err);
      toast.error(err.message || "Không thể duyệt đề xuất mua hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!requisition) return;

    try {
      setActionLoading(true);
      await purchaseRequisitionApi.reject(requisition.id, { reason });
      toast.success("Đã từ chối đề xuất mua hàng!");
      setIsRejectDialogOpen(false);
      await reloadRequisition();
    } catch (err: any) {
      console.error("Error rejecting requisition:", err);
      toast.error(err.message || "Không thể từ chối đề xuất mua hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!requisition) return;

    const confirmed = await confirm({
      title: "Xác nhận đã mua hàng",
      message:
        "Bạn có chắc muốn xác nhận đã mua hàng cho đề xuất này? Thông báo sẽ được gửi đến người tạo đề xuất và người duyệt.",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      type: "info",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await purchaseRequisitionApi.confirmPurchase(requisition.id, {});
      toast.success("Xác nhận mua hàng thành công!");
      await reloadRequisition();
    } catch (err: any) {
      console.error("Error confirming purchase:", err);
      toast.error(err.message || "Không thể xác nhận mua hàng");
    } finally {
      setActionLoading(false);
    }
  };

  // Get order display info - prefer MisaSaOrder if available
  const getOrderDisplay = () => {
    if (requisition?.misaSaOrder) {
      return {
        orderNumber: requisition.misaSaOrder.refNo,
        customerName: requisition.misaSaOrder.accountObjectName,
        customerAddress: requisition.misaSaOrder.accountObjectAddress,
        orderDate: requisition.misaSaOrder.refDate,
        items: saOrderDetails,
        isSaOrder: true,
      };
    }
    if (requisition?.misaOrder) {
      return {
        orderNumber: requisition.misaOrder.orderNumber,
        customerName: requisition.misaOrder.customerName,
        customerAddress: requisition.misaOrder.customerAddress,
        orderDate: requisition.misaOrder.orderDate,
        items: requisition.misaOrder.items || [],
        isSaOrder: false,
      };
    }
    return {
      orderNumber: "-",
      customerName: null,
      customerAddress: null,
      orderDate: null,
      items: [],
      isSaOrder: false,
    };
  };

  const getActionButtons = () => {
    if (!requisition) return null;

    const buttons = [];

    // Nút Duyệt - chỉ hiện khi status là pending
    if (requisition.status === "pending") {
      buttons.push(
        <Button
          key="approve"
          onClick={handleApprove}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Duyệt đề xuất
        </Button>,
      );

      buttons.push(
        <Button
          key="reject"
          onClick={() => setIsRejectDialogOpen(true)}
          disabled={actionLoading}
          variant="outline"
          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Từ chối
        </Button>,
      );
    }

    // Nút Xác nhận mua hàng - chỉ hiện khi status là approved
    if (requisition.status === "approved") {
      buttons.push(
        <Button
          key="confirm_purchase"
          onClick={handleConfirmPurchase}
          disabled={actionLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Xác nhận mua hàng
        </Button>,
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error || !requisition) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/quan-ly/de-xuat-mua-hang")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="text-center text-red-500">
          {error || "Không tìm thấy đề xuất mua hàng"}
        </div>
      </div>
    );
  }

  const orderDisplay = getOrderDisplay();

  console.log(requisition.createdAt);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/quan-ly/de-xuat-mua-hang")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Đề xuất {requisition.requisitionNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Ngày tạo:{" "}
                {requisition.createdAt
                  ? format(new Date(requisition.createdAt), "dd/MM/yyyy HH:mm")
                  : "-"}
              </p>
            </div>
          </div>
          <div>{getStatusBadge(requisition.status)}</div>
        </div>

        {/* Action Buttons */}
        {getActionButtons() && getActionButtons()!.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            {getActionButtons()}
          </div>
        )}
      </div>

      {/* Requisition Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Thông tin đề xuất
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Số đề xuất</div>
                <div className="font-medium">
                  {requisition.requisitionNumber}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Nhà máy</div>
                <div className="font-medium">
                  {requisition.factory?.name || "-"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Đơn hàng liên quan</div>
                <div className="font-medium text-blue-600">
                  {orderDisplay.orderNumber}
                  {orderDisplay.isSaOrder && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      MISA Sync
                    </span>
                  )}
                </div>
                {orderDisplay.customerName && (
                  <div className="text-xs text-gray-500 mt-1">
                    Khách hàng: {orderDisplay.customerName}
                  </div>
                )}
              </div>
            </div>
            {requisition.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Ghi chú</div>
                  <div className="font-medium whitespace-pre-wrap">
                    {requisition.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* People Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Thông tin người xử lý
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Người tạo đề xuất</div>
                <div className="font-medium">
                  {requisition.createdBy?.user?.fullName || "-"}
                </div>
                {requisition.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    {format(
                      new Date(requisition.createdAt),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </div>
                )}
              </div>
            </div>

            {requisition.approvedBy && (
              <div className="flex items-start gap-3">
                {requisition.status === "approved" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <div className="text-sm text-gray-500">
                    {requisition.status === "approved"
                      ? "Người duyệt"
                      : "Người từ chối"}
                  </div>
                  <div className="font-medium">
                    {requisition.approvedBy?.user?.fullName || "-"}
                  </div>
                  {requisition.approvedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(
                        new Date(requisition.approvedAt),
                        "dd/MM/yyyy HH:mm",
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {requisition.approvalNotes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">
                    {requisition.status === "rejected"
                      ? "Lý do từ chối"
                      : "Ghi chú duyệt"}
                  </div>
                  <div
                    className={`font-medium ${requisition.status === "rejected" ? "text-red-600" : ""}`}
                  >
                    {requisition.approvalNotes}
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin xác nhận mua hàng */}
            {requisition.purchaseConfirmedBy && (
              <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">
                    Người xác nhận mua hàng
                  </div>
                  <div className="font-medium">
                    {requisition.purchaseConfirmedBy?.user?.fullName || "-"}
                  </div>
                  {requisition.purchaseConfirmedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(
                        new Date(requisition.purchaseConfirmedAt),
                        "dd/MM/yyyy HH:mm",
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {requisition.purchaseConfirmNotes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">
                    Ghi chú xác nhận mua hàng
                  </div>
                  <div className="font-medium">
                    {requisition.purchaseConfirmNotes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      {orderDisplay.items && orderDisplay.items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Danh sách sản phẩm trong đơn hàng ({orderDisplay.items.length})
            </h2>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
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
                  {orderDisplay.isSaOrder && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderDisplay.isSaOrder
                  ? // MisaSaOrderDetail items
                    (orderDisplay.items as MisaSaOrderDetail[]).map(
                      (item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.inventoryItemCode || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {item.description || "-"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unitName || "-"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.quantity?.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.unitPrice?.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {item.amountOc?.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ),
                    )
                  : // MisaOrderItem items (legacy)
                    (orderDisplay.items as any[]).map(
                      (item: any, index: number) => (
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
                        </tr>
                      ),
                    )}
              </tbody>
              {orderDisplay.isSaOrder && orderDisplay.items.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
                    >
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {(orderDisplay.items as MisaSaOrderDetail[])
                        .reduce((sum, item) => sum + (item.amountOc || 0), 0)
                        .toLocaleString("vi-VN")}{" "}
                      VND
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={actionLoading}
      />
    </div>
  );
}
