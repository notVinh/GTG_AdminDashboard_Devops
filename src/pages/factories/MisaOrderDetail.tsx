import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  Truck,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { misaOrderApi } from "../../api/misa-order";
import type { MisaOrder, OrderAssignment } from "../../types/misa-order";
import { Button } from "../../components/ui/button";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { format } from "date-fns";
import AssignOrderDialog from "../../components/AssignOrderDialog";
import { usersApi } from "../../api/users";

const getStepLabel = (step: string): string => {
  const stepMap: Record<string, string> = {
    inventory_check: "Kiểm tra hàng tồn",
    pending_order: "Chờ đặt hàng",
    warehouse: "Kho chuẩn bị máy + phiếu xuất kho",
    quality_check: "Kỹ thuật kiểm tra máy + ký xác nhận",
    delivery: "Kho, giao vận nhận máy + ký phiếu",
    gate_control: "Kiểm soát + Bảo vệ kiểm tra",
    self_delivery: "Giao vận chuyển máy đến khách hàng",
    installation: "Kỹ thuật lắp đặt máy + ký phiếu bàn giao",
    shipping_company: "Giao cho công ty vận chuyển",
  };
  return stepMap[step] || step;
};

const AssignmentHistory = ({ assignments }: { assignments: OrderAssignment[] }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group assignments by step and revision
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const key = `${assignment.step}-${assignment.revision}`;
    if (!acc[key]) {
      acc[key] = {
        step: assignment.step,
        revision: assignment.revision,
        assignments: [],
      };
    }
    acc[key].assignments.push(assignment);
    return acc;
  }, {} as Record<string, { step: string; revision: number; assignments: OrderAssignment[] }>);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Lịch sử giao việc
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {Object.entries(groupedAssignments).map(([key, group]) => {
          const isExpanded = expandedGroups.has(key);
          return (
            <div key={key}>
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleGroup(key)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">{getStepLabel(group.step)}</div>
                    <div className="text-sm text-gray-500">
                      {group.assignments.length} nhân viên được giao
                      {group.revision > 0 && ` • Lần ${group.revision + 1}`}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50 space-y-3">
                  {group.assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Nhân viên:</span>{" "}
                            <span className="font-medium">{assignment.employee?.user?.fullName || "-"}</span>
                          </div>
                        </div>
                        {assignment.assignedBy && (
                          <div className="flex items-start gap-2">
                            <UserPlus className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-gray-500">Người giao:</span>{" "}
                              <span className="font-medium">{assignment.assignedBy?.user?.fullName || "-"}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Thời gian:</span>{" "}
                            <span className="font-medium">
                              {format(new Date(assignment.assignedAt), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                        </div>
                        {assignment.notes && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-gray-500">Ghi chú:</span>{" "}
                              <span className="font-medium">{assignment.notes}</span>
                            </div>
                          </div>
                        )}
                        {assignment.step === "shipping_company" && assignment.shippingCompanyName && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="font-medium text-gray-700 mb-2">Thông tin vận chuyển:</div>
                            <div className="space-y-1 pl-6">
                              <div className="flex items-start gap-2">
                                <Truck className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                  <span className="text-gray-500">Công ty:</span>{" "}
                                  <span className="font-medium">{assignment.shippingCompanyName}</span>
                                </div>
                              </div>
                              {assignment.shippingCompanyPhone && (
                                <div className="flex items-start gap-2">
                                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <span className="text-gray-500">SĐT:</span>{" "}
                                    <span className="font-medium">{assignment.shippingCompanyPhone}</span>
                                  </div>
                                </div>
                              )}
                              {assignment.trackingNumber && (
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <span className="text-gray-500">Mã vận đơn:</span>{" "}
                                    <span className="font-medium">{assignment.trackingNumber}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getStepBadge = (step?: string, status?: string) => {
  // If order is completed or cancelled, show that status instead of step
  if (status === "completed" || status === "cancelled") {
    const statusMap: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      cancelled: {
        label: "Đã hủy",
        className: "bg-red-100 text-red-800",
        icon: <XCircle className="h-4 w-4" />,
      },
      completed: {
        label: "Hoàn thành",
        className: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
      },
    };

    const statusInfo = statusMap[status || ""] || {
      label: status || "-",
      className: "bg-gray-100 text-gray-800",
      icon: null,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full text-center leading-tight ${statusInfo.className}`}
        style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
      >
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </span>
    );
  }

  // If no step, show status
  if (!step) {
    const statusMap: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      pendingApproval: {
        label: "Chờ duyệt",
        className: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-4 w-4" />,
      },
      approved: {
        label: "Đã duyệt",
        className: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      cancelled: {
        label: "Đã hủy",
        className: "bg-red-100 text-red-800",
        icon: <XCircle className="h-4 w-4" />,
      },
      completed: {
        label: "Hoàn thành",
        className: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
      },
    };

    const statusInfo = statusMap[status || ""] || {
      label: status || "-",
      className: "bg-gray-100 text-gray-800",
      icon: null,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full text-center leading-tight ${statusInfo.className}`}
        style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
      >
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </span>
    );
  }

  // Show step badge
  const stepMap: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    warehouse: {
      label: "Kho chuẩn bị",
      className: "bg-purple-100 text-purple-800",
      icon: <Package className="h-4 w-4" />,
    },
    quality_check: {
      label: "Kiểm tra chất lượng",
      className: "bg-purple-100 text-purple-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    delivery: {
      label: "Giao vận nhận máy",
      className: "bg-blue-100 text-blue-800",
      icon: <Package className="h-4 w-4" />,
    },
    gate_control: {
      label: "Kiểm soát cổng",
      className: "bg-blue-100 text-blue-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    self_delivery: {
      label: "Giao hàng trực tiếp",
      className: "bg-cyan-100 text-cyan-800",
      icon: <Package className="h-4 w-4" />,
    },
    installation: {
      label: "Lắp đặt",
      className: "bg-cyan-100 text-cyan-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    shipping_company: {
      label: "Vận chuyển",
      className: "bg-cyan-100 text-cyan-800",
      icon: <Truck className="h-4 w-4" />,
    },
  };

  const stepInfo = stepMap[step] || {
    label: step,
    className: "bg-gray-100 text-gray-800",
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full text-center leading-tight ${stepInfo.className}`}
      style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
    >
      {stepInfo.icon}
      <span>{stepInfo.label}</span>
    </span>
  );
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    pendingApproval: {
      label: "Chờ duyệt",
      className: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-4 w-4" />,
    },
    approved: {
      label: "Đã duyệt",
      className: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    assigned: {
      label: "Đã giao",
      className: "bg-blue-100 text-blue-800",
      icon: <User className="h-4 w-4" />,
    },
    processing: {
      label: "Đang xử lý",
      className: "bg-purple-100 text-purple-800",
      icon: <Clock className="h-4 w-4" />,
    },
    completed: {
      label: "Hoàn thành",
      className: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-4 w-4" />,
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

export default function MisaOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [order, setOrder] = useState<MisaOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [myFactory, setMyFactory] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Load factory info
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const factory = await usersApi.getMyFactory();
        if (mounted) {
          setMyFactory(factory);
        }
      } catch (err) {
        console.error("Error loading factory:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Load order
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await misaOrderApi.getById(Number(id));
        if (mounted) {
          setOrder(data);
        }
      } catch (err: any) {
        console.error("Error loading order:", err);
        if (mounted) {
          setError(err.message || "Không thể tải thông tin đơn hàng");
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
      const updatedOrder = await misaOrderApi.getById(order.id);
      setOrder(updatedOrder);
    } catch (err: any) {
      console.error("Error reloading order:", err);
    }
  };

  const handleApprove = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận duyệt đơn hàng",
      message: "Bạn có chắc muốn duyệt đơn hàng này?",
      confirmText: "Duyệt",
      cancelText: "Hủy",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.approve(order.id);
      toast.success("Duyệt đơn hàng thành công!");
      await reloadOrder();
    } catch (err: any) {
      console.error("Error approving order:", err);
      toast.error(err.message || "Không thể duyệt đơn hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!order) return;

    const statusLabel = {
      processing: "Đang xử lý",
      completed: "Hoàn thành",
      cancelled: "Hủy",
    }[status] || status;

    const confirmed = await confirm({
      title: "Xác nhận cập nhật trạng thái",
      message: `Bạn có chắc muốn chuyển trạng thái thành "${statusLabel}"?`,
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      type: status === "cancelled" ? "danger" : undefined,
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.updateStatus(order.id, status);
      toast.success("Cập nhật trạng thái thành công!");
      await reloadOrder();
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận hoàn thành đơn hàng",
      message: "Bạn có chắc muốn hoàn thành đơn hàng này? Đơn hàng đã hoàn thành sẽ chuyển sang trạng thái hoàn thành.",
      confirmText: "Hoàn thành",
      cancelText: "Hủy",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.complete(order.id);
      toast.success("Hoàn thành đơn hàng thành công!");
      await reloadOrder();
    } catch (err: any) {
      console.error("Error completing order:", err);
      toast.error(err.message || "Không thể hoàn thành đơn hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: "Xác nhận xóa đơn hàng",
      message: "Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.delete(order.id);
      toast.success("Xóa đơn hàng thành công!");
      navigate("/nha-may-cua-toi/misa-orders");
    } catch (err: any) {
      console.error("Error deleting order:", err);
      toast.error(err.message || "Không thể xóa đơn hàng");
      setActionLoading(false);
    }
  };

  const getActionButtons = () => {
    if (!order) return null;

    const buttons = [];

    // Nút Duyệt - chỉ hiện khi status là pendingApproval
    if (order.status === "pendingApproval") {
      buttons.push(
        <Button
          key="approve"
          onClick={handleApprove}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Duyệt
        </Button>
      );
    }

    // Nút Giao việc - hiện cho đã duyệt, đã giao, hoặc đang xử lý (để giao lại hoặc giao bước mới)
    if (["approved", "assigned", "processing"].includes(order.status)) {
      buttons.push(
        <Button
          key="assign"
          onClick={() => setIsAssignDialogOpen(true)}
          disabled={actionLoading}
          variant="outline"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Giao việc
        </Button>
      );
    }

    // Nút Hoàn thành - chỉ hiện khi đang ở bước installation
    if (order.currentStep === "installation" && !["completed", "cancelled"].includes(order.status)) {
      buttons.push(
        <Button
          key="complete"
          onClick={handleComplete}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Hoàn thành
        </Button>
      );
    }

    // Nút Hủy - chỉ hiện khi chưa hoàn thành
    if (!["completed", "cancelled"].includes(order.status)) {
      buttons.push(
        <Button
          key="cancel"
          onClick={() => handleUpdateStatus("cancelled")}
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
          onClick={() => navigate("/nha-may-cua-toi/misa-orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="text-center text-red-500">
          {error || "Không tìm thấy đơn hàng"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/nha-may-cua-toi/misa-orders")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Đơn hàng {order.orderNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Ngày đặt: {format(new Date(order.orderDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
          <div>{getStepBadge(order.currentStep, order.status)}</div>
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
        {/* Customer Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Thông tin khách hàng
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div>
                <div className="text-sm text-gray-500">Tên khách hàng</div>
                <div className="font-medium">{order.customerName}</div>
              </div>
            </div>
            {order.customerPhone && (
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-sm text-gray-500">Số điện thoại</div>
                  <div className="font-medium">{order.customerPhone}</div>
                </div>
              </div>
            )}
            {order.customerAddress && (
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-sm text-gray-500">Địa chỉ</div>
                  <div className="font-medium">{order.customerAddress}</div>
                </div>
              </div>
            )}
            {order.customerTaxCode && (
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-sm text-gray-500">Mã số thuế</div>
                  <div className="font-medium">{order.customerTaxCode}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Thông tin đơn hàng
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
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
                  {format(new Date(order.orderDate), "dd/MM/yyyy")}
                </div>
              </div>
            </div>
            {order.deliveryDate && (
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Ngày giao hàng</div>
                  <div className="font-medium">
                    {format(new Date(order.deliveryDate), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
            )}
            {order.totalAmount && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Tổng tiền</div>
                  <div className="font-bold text-lg text-green-600">
                    {order.totalAmount.toLocaleString()} VNĐ
                  </div>
                </div>
              </div>
            )}
            {order.currentStep && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Bước hiện tại</div>
                  <div className="font-medium">
                    {getStepLabel(order.currentStep)}
                  </div>
                </div>
              </div>
            )}
            {order.approvedBy && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Người duyệt</div>
                  <div className="font-medium">
                    {order.approvedBy?.user?.fullName || "-"}
                  </div>
                </div>
              </div>
            )}
            {order.assignedTo && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Người được giao</div>
                  <div className="font-medium">
                    {order.assignedTo?.user?.fullName || "-"}
                  </div>
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

      {/* Assignment History */}
      {order.assignments && order.assignments.length > 0 && (
        <AssignmentHistory assignments={order.assignments} />
      )}

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Danh sách sản phẩm ({(order as any).items?.length || 0})
          </h2>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {(order as any).items?.map((item: any, index: number) => (
            <div key={item.id || index} className="p-4 space-y-2">
              <div className="font-medium text-gray-900">{item.productName}</div>
              {item.productCode && (
                <div className="text-sm text-gray-500">Mã: {item.productCode}</div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Số lượng:</span>{" "}
                  <span className="font-medium">{item.quantity}</span>
                </div>
                <div>
                  <span className="text-gray-500">ĐVT:</span>{" "}
                  <span className="font-medium">{item.unit || "-"}</span>
                </div>
                {item.unitPrice && (
                  <div>
                    <span className="text-gray-500">Đơn giá:</span>{" "}
                    <span className="font-medium">
                      {item.unitPrice.toLocaleString()} VNĐ
                    </span>
                  </div>
                )}
                {item.totalPrice && (
                  <div>
                    <span className="text-gray-500">Thành tiền:</span>{" "}
                    <span className="font-medium">
                      {item.totalPrice.toLocaleString()} VNĐ
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
              {(order as any).items?.map((item: any, index: number) => (
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
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.unitPrice ? `${item.unitPrice.toLocaleString()}` : "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {item.totalPrice
                      ? `${item.totalPrice.toLocaleString()}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!(order as any).items?.length && (
          <div className="p-8 text-center text-gray-500">
            Không có sản phẩm nào
          </div>
        )}
      </div>

      {/* Assign Order Dialog */}
      {myFactory && (
        <AssignOrderDialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          orderId={order.id}
          factoryId={myFactory.id}
          onSuccess={reloadOrder}
        />
      )}
    </div>
  );
}
