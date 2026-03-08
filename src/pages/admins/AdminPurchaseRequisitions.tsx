import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Package,
  Plus,
  Edit,
  Send,
  ShoppingCart,
} from "lucide-react";
import { purchaseRequisitionApi } from "../../api/purchase-requisition";
import type { PurchaseRequisition } from "../../types/purchase-requisition";
import { useToast } from "../../contexts/ToastContext";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import MonthNavigation from "../../components/commons/MonthNavigation";
import Pagination from "../../components/commons/Pagination";
import CreatePurchaseRequisitionModal from "../../components/CreatePurchaseRequisitionModal";
import ConfirmModal from "../../components/ConfirmModal";
import { format } from "date-fns";

const STATUS_MAP = {
  pending: {
    label: "Chờ duyệt",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  approved: {
    label: "Đã duyệt",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  },
  rejected: {
    label: "Từ chối",
    color: "text-red-600 bg-red-50",
    icon: XCircle,
  },
  revision_required: {
    label: "Cần chỉnh sửa",
    color: "text-purple-600 bg-purple-50",
    icon: Edit,
  },
  purchase_confirmed: {
    label: "Đã mua hàng",
    color: "text-blue-600 bg-blue-50",
    icon: ShoppingCart,
  },
};

export default function AdminPurchaseRequisitions() {
  const navigate = useNavigate();
  const toast = useToast();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Workflow action modal state - dùng chung cho approve/reject/request_revision/resubmit/confirm_purchase
  type WorkflowActionType = "approve" | "reject" | "request_revision" | "resubmit" | "confirm_purchase" | null;
  const [workflowModal, setWorkflowModal] = useState<{
    type: WorkflowActionType;
    requisition: PurchaseRequisition | null;
    note: string;
    loading: boolean;
  }>({
    type: null,
    requisition: null,
    note: "",
    loading: false,
  });

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch requisitions
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

        const result = await purchaseRequisitionApi.getAll(query);

        if (isMounted) {
          if (Array.isArray(result)) {
            setRequisitions(result);
            setTotal(result.length);
          } else {
            setRequisitions(result?.data || []);
            setTotal(result?.meta?.total || 0);
          }
        }
      } catch (error: any) {
        console.error("Error fetching purchase requisitions:", error);
        if (isMounted) {
          toast?.error("Khong the tai danh sach de xuat mua hang");
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
  }, [page, limit, statusFilter, startDate, endDate, refreshKey]);

  // Client-side search filtering
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const reqNumber = req.requisitionNumber.toLowerCase();
        const orderNumber = req.misaOrder?.orderNumber?.toLowerCase() || "";
        const saOrderRefNo = req.misaSaOrder?.refNo?.toLowerCase() || "";
        const factoryName = req.factory?.name?.toLowerCase() || "";
        return (
          reqNumber.includes(search) ||
          orderNumber.includes(search) ||
          saOrderRefNo.includes(search) ||
          factoryName.includes(search)
        );
      }
      return true;
    });
  }, [requisitions, searchTerm]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    searchTerm,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
    limit,
  ]);

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
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      revision_required: "bg-purple-100 text-purple-800",
      purchase_confirmed: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${
          colorMap[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </span>
    );
  };

  // Open workflow modal
  const openWorkflowModal = (
    type: WorkflowActionType,
    requisition: PurchaseRequisition
  ) => {
    setWorkflowModal({ type, requisition, note: "", loading: false });
  };

  // Close workflow modal
  const closeWorkflowModal = () => {
    setWorkflowModal({ type: null, requisition: null, note: "", loading: false });
  };

  // Handle workflow action confirm
  const handleWorkflowConfirm = async () => {
    if (!workflowModal.requisition || !workflowModal.type) return;

    const { type, requisition, note } = workflowModal;

    // Validate required note for reject and request_revision
    if ((type === "reject" || type === "request_revision") && !note.trim()) {
      toast?.error(type === "reject" ? "Vui lòng nhập lý do từ chối" : "Vui lòng nhập lý do yêu cầu chỉnh sửa");
      return;
    }

    setWorkflowModal((prev) => ({ ...prev, loading: true }));

    try {
      let successMessage = "";

      if (type === "approve") {
        await purchaseRequisitionApi.approve(requisition.id, {
          notes: note.trim() || undefined,
        });
        successMessage = "Duyệt đề xuất mua hàng thành công";
      } else if (type === "reject") {
        await purchaseRequisitionApi.reject(requisition.id, {
          reason: note.trim(),
        });
        successMessage = "Từ chối đề xuất mua hàng thành công";
      } else if (type === "request_revision") {
        await purchaseRequisitionApi.requestRevision(requisition.id, {
          reason: note.trim(),
        });
        successMessage = "Yêu cầu chỉnh sửa đề xuất thành công";
      } else if (type === "resubmit") {
        await purchaseRequisitionApi.resubmit(requisition.id, {
          notes: note.trim() || undefined,
        });
        successMessage = "Gửi lại đề xuất mua hàng thành công";
      } else if (type === "confirm_purchase") {
        await purchaseRequisitionApi.confirmPurchase(requisition.id, {
          notes: note.trim() || undefined,
        });
        successMessage = "Xác nhận mua hàng thành công";
      }

      toast?.success(successMessage);
      closeWorkflowModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error processing workflow action:", error);
      toast?.error(error?.message || "Có lỗi xảy ra");
    } finally {
      setWorkflowModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Get modal config based on action type
  const getWorkflowModalConfig = () => {
    switch (workflowModal.type) {
      case "approve":
        return {
          title: "Xác nhận duyệt đề xuất",
          description: `Bạn có chắc chắn muốn duyệt đề xuất "${workflowModal.requisition?.requisitionNumber}"?`,
          confirmText: "Duyệt",
          variant: "default" as const,
          showInput: true,
          inputLabel: "Ghi chú (không bắt buộc)",
          inputPlaceholder: "Nhập ghi chú nếu có...",
          inputRequired: false,
        };
      case "reject":
        return {
          title: "Xác nhận từ chối đề xuất",
          description: `Bạn có chắc chắn muốn từ chối đề xuất "${workflowModal.requisition?.requisitionNumber}"?`,
          confirmText: "Từ chối",
          variant: "danger" as const,
          showInput: true,
          inputLabel: "Lý do từ chối",
          inputPlaceholder: "Nhập lý do từ chối đề xuất...",
          inputRequired: true,
          inputError:
            workflowModal.type === "reject" && !workflowModal.note.trim()
              ? "Vui lòng nhập lý do từ chối"
              : "",
        };
      case "request_revision":
        return {
          title: "Yêu cầu chỉnh sửa đề xuất",
          description: `Bạn có chắc chắn muốn yêu cầu chỉnh sửa đề xuất "${workflowModal.requisition?.requisitionNumber}"?`,
          confirmText: "Yêu cầu chỉnh sửa",
          variant: "warning" as const,
          showInput: true,
          inputLabel: "Lý do yêu cầu chỉnh sửa",
          inputPlaceholder: "Nhập lý do yêu cầu chỉnh sửa...",
          inputRequired: true,
          inputError:
            workflowModal.type === "request_revision" && !workflowModal.note.trim()
              ? "Vui lòng nhập lý do yêu cầu chỉnh sửa"
              : "",
        };
      case "resubmit":
        return {
          title: "Gửi lại đề xuất mua hàng",
          description: `Bạn có chắc chắn muốn gửi lại đề xuất "${workflowModal.requisition?.requisitionNumber}"?`,
          confirmText: "Gửi lại",
          variant: "default" as const,
          showInput: true,
          inputLabel: "Ghi chú (không bắt buộc)",
          inputPlaceholder: "Nhập ghi chú nếu có...",
          inputRequired: false,
        };
      case "confirm_purchase":
        return {
          title: "Xác nhận đã mua hàng",
          description: `Bạn có chắc chắn muốn xác nhận đã mua hàng cho đề xuất "${workflowModal.requisition?.requisitionNumber}"?`,
          confirmText: "Xác nhận",
          variant: "default" as const,
          showInput: true,
          inputLabel: "Ghi chú (không bắt buộc)",
          inputPlaceholder: "Nhập ghi chú về việc mua hàng...",
          inputRequired: false,
        };
      default:
        return null;
    }
  };

  // Get order display info - prefer MisaSaOrder if available
  const getOrderDisplay = (req: PurchaseRequisition) => {
    if (req.misaSaOrder) {
      return {
        orderNumber: req.misaSaOrder.refNo,
        customerName: req.misaSaOrder.accountObjectName,
      };
    }
    if (req.misaOrder) {
      return {
        orderNumber: req.misaOrder.orderNumber,
        customerName: req.misaOrder.customerName,
      };
    }
    return { orderNumber: "-", customerName: null };
  };

  const getActions = (req: PurchaseRequisition) => {
    const actions: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      variant?: "danger" | "warning";
    }> = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => navigate(`/quan-ly/de-xuat-mua-hang/${req.id}`),
      },
    ];

    // Chỉ hiển thị nút duyệt/từ chối/yêu cầu chỉnh sửa khi status là pending
    if (req.status === "pending") {
      actions.push({
        label: "Duyệt",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => openWorkflowModal("approve", req),
      });
      actions.push({
        label: "Từ chối",
        icon: <XCircle className="h-4 w-4" />,
        onClick: () => openWorkflowModal("reject", req),
        variant: "danger",
      });
      actions.push({
        label: "Yêu cầu chỉnh sửa",
        icon: <Edit className="h-4 w-4" />,
        onClick: () => openWorkflowModal("request_revision", req),
        variant: "warning",
      });
    }

    // Hiển thị nút gửi lại khi status là revision_required
    if (req.status === "revision_required") {
      actions.push({
        label: "Gửi lại",
        icon: <Send className="h-4 w-4" />,
        onClick: () => openWorkflowModal("resubmit", req),
      });
    }

    // Hiển thị nút xác nhận mua hàng khi status là approved
    if (req.status === "approved") {
      actions.push({
        label: "Xác nhận mua hàng",
        icon: <ShoppingCart className="h-4 w-4" />,
        onClick: () => openWorkflowModal("confirm_purchase", req),
      });
    }

    return actions;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Quản lý đề xuất mua hàng
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Tạo đề xuất
        </button>
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
                { value: "pending", label: "Chờ duyệt" },
                { value: "approved", label: "Đã duyệt" },
                { value: "rejected", label: "Từ chối" },
                { value: "revision_required", label: "Cần chỉnh sửa" },
                { value: "purchase_confirmed", label: "Đã mua hàng" },
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
                placeholder="Nhập số đề xuất, số đơn hàng hoặc tên nhà may..."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const totalReqs = filteredRequisitions.length;
          const pendingCount = filteredRequisitions.filter(
            (r) => r.status === "pending"
          ).length;
          const approvedCount = filteredRequisitions.filter(
            (r) => r.status === "approved"
          ).length;
          return (
            <>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalReqs}</div>
                    <div className="text-sm text-gray-500">Tổng đề xuất</div>
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
                    <div className="text-sm text-gray-500">Chờ duyệt</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{approvedCount}</div>
                    <div className="text-sm text-gray-500">Đã duyệt</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">
            Danh sách đề xuất mua hàng
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
          ) : filteredRequisitions.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm">
              Không có đề xuất nào trong tháng {selectedMonth + 1} năm{" "}
              {selectedYear}
            </div>
          ) : (
            filteredRequisitions.map((req) => {
              const orderDisplay = getOrderDisplay(req);
              return (
                <div
                  key={req.id}
                  className="p-4 space-y-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    navigate(`/quan-ly/de-xuat-mua-hang/${req.id}`)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-col gap-2 mb-2">
                        <span className="font-bold text-blue-600 text-base">
                          {req.requisitionNumber}
                        </span>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-gray-500">Đơn hàng:</span>{" "}
                            <span className="text-gray-900 font-medium">
                              {orderDisplay.orderNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-gray-500">Nhà máy:</span>{" "}
                            <span className="text-gray-900">
                              {req.factory?.name || "-"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-gray-500">Người tạo:</span>{" "}
                            <span className="text-gray-900">
                              {req.createdBy?.user?.fullName || "-"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-gray-500">Ngày tạo:</span>{" "}
                            <span className="text-gray-900">
                              {req.createdAt
                                ? format(new Date(req.createdAt), "dd/MM/yyyy")
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex justify-end pt-2 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionsDropdown actions={getActions(req)} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số đề xuất
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
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
                  <td colSpan={7} className="px-4 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center">
                    Khong co de xuat nao trong thang {selectedMonth + 1} nam{" "}
                    {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => {
                  const orderDisplay = getOrderDisplay(req);
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/quan-ly/de-xuat-mua-hang/${req.id}`)
                      }
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {req.requisitionNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {orderDisplay.orderNumber}
                          </div>
                          {orderDisplay.customerName && (
                            <div className="text-xs text-gray-500">
                              {orderDisplay.customerName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.createdBy?.user?.fullName || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.createdAt
                          ? format(new Date(req.createdAt), "dd/MM/yyyy")
                          : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-[200px]">
                          {getStatusBadge(req.status)}
                        </div>
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionsDropdown actions={getActions(req)} />
                      </td>
                    </tr>
                  );
                })
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

      {/* Create Modal */}
      <CreatePurchaseRequisitionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(message) => {
          toast?.success(message);
          // Refresh list immediately
          setRefreshKey((prev) => prev + 1);
        }}
        onError={(message) => {
          toast?.error(message);
        }}
      />

      {/* Workflow Action Confirmation Modal */}
      {workflowModal.type && (
        <ConfirmModal
          isOpen={!!workflowModal.type}
          onClose={closeWorkflowModal}
          onConfirm={handleWorkflowConfirm}
          title={getWorkflowModalConfig()?.title || ""}
          description={getWorkflowModalConfig()?.description || ""}
          confirmText={
            workflowModal.loading
              ? "Đang xử lý..."
              : getWorkflowModalConfig()?.confirmText
          }
          variant={getWorkflowModalConfig()?.variant}
          showInput={getWorkflowModalConfig()?.showInput}
          inputValue={workflowModal.note}
          onInputChange={(value) =>
            setWorkflowModal((prev) => ({ ...prev, note: value }))
          }
          inputLabel={getWorkflowModalConfig()?.inputLabel}
          inputPlaceholder={getWorkflowModalConfig()?.inputPlaceholder}
          inputRequired={getWorkflowModalConfig()?.inputRequired}
          inputError={getWorkflowModalConfig()?.inputError}
        />
      )}
    </div>
  );
}
