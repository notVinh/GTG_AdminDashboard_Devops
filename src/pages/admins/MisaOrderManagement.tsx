import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  RefreshCw,
  Eye,
  Package,
  Send,
  CheckCircle,
  Filter,
  X,
  Pencil,
  Plus,
  XCircle,
  RotateCcw,
} from "lucide-react";
import ManualOrderForm from "../../components/ManualOrderForm";
import ConfirmModal from "../../components/ConfirmModal";
import { MisaSearchBar } from "../../components/commons/MisaSearchBar";
import {
  misaDataSourceApi,
  type MisaSaOrder,
  type MisaSaOrderDetail,
  type MisaSaOrderLocalFieldsUpdate,
  ORDER_WORKFLOW_STATUS,
} from "../../api/misa-data-source";
import { Pagination } from "../../components/commons/Pagination";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "../../contexts/ToastContext";

type TabType = "sales-orders";

const extractProvince = (address: string | null | undefined): string => {
  if (!address) return "";

  // Tách mảng bằng dấu phẩy và xóa khoảng trắng
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  if (parts.length === 0) return "";

  const lastPart = parts[parts.length - 1];

  // Nếu phần cuối là Việt Nam, lấy phần kế cuối
  if (
    lastPart.toLowerCase() === "việt nam" ||
    lastPart.toLowerCase() === "vietnam"
  ) {
    return parts.length >= 2 ? parts[parts.length - 2] : "";
  }

  // Nếu không, lấy phần cuối cùng
  return lastPart;
};

export default function MisaOrderManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("sales-orders");

  // Helper function to update search params
  const updateSearchParams = useCallback(
    (newParams: Record<string, string | number | null | undefined>) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      });
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Sales Orders state - init from URL
  const [orders, setOrders] = useState<MisaSaOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
    syncId?: number;
  } | null>(null);
  const [syncDetails, setSyncDetails] = useState<{
    created: Array<{ code: string; name: string }>;
    updated: Array<{
      code: string;
      name: string;
      changes: Record<string, { old: any; new: any }>;
    }>;
    merged?: Array<{
      code: string;
      name: string;
      oldRefId: string;
      newRefId: string;
    }>;
    detailUpdated?: Array<{ code: string; name: string }>;
  } | null>(null);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [loadingSyncDetails, setLoadingSyncDetails] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [total, setTotal] = useState(0);

  // Sync state with URL when page/limit/search changes
  useEffect(() => {
    const urlPage = Number(searchParams.get("page")) || 1;
    const urlLimit = Number(searchParams.get("limit")) || 20;
    const urlSearch = searchParams.get("search") || "";

    if (page !== urlPage) setPage(urlPage);
    if (limit !== urlLimit) setLimit(urlLimit);
    if (search !== urlSearch) setSearch(urlSearch);
  }, [searchParams]);

  // Special setPage that updates URL
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    updateSearchParams({ page: 1, limit: newLimit });
  };

  // Selected order and details
  const [selectedOrder, setSelectedOrder] = useState<MisaSaOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<MisaSaOrderDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Editing state (inline for draft orders)
  const [editingCell, setEditingCell] = useState<{
    orderId: number;
    field: keyof MisaSaOrderLocalFieldsUpdate;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Detail panel edit state (for non-draft orders)
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailEditValues, setDetailEditValues] =
    useState<MisaSaOrderLocalFieldsUpdate>({});

  // Manual order form state
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);

  // Workflow action modal state - dùng chung cho tất cả actions
  type WorkflowActionType = "submit" | "approve" | "reject" | "resubmit" | null;
  const [workflowModal, setWorkflowModal] = useState<{
    type: WorkflowActionType;
    order: MisaSaOrder | null;
    note: string;
    loading: boolean;
  }>({
    type: null,
    order: null,
    note: "",
    loading: false,
  });

  // Detail panel toggle
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    localDeliveryStatus: searchParams.get("localDeliveryStatus") || "",
    orderWorkflowStatus: searchParams.get("orderWorkflowStatus") || "",
    priority: searchParams.get("priority") || "",
    machineType: searchParams.get("machineType") || "",
    saleType: searchParams.get("saleType") || "",
    region: searchParams.get("region") || "",
    provinceSearch: searchParams.get("province") || "",
    reqDeliveryStartDate: searchParams.get("reqDeliveryStartDate") || "",
    reqDeliveryEndDate: searchParams.get("reqDeliveryEndDate") || "",
    actualExportStartDate: searchParams.get("actualExportStartDate") || "",
    actualExportEndDate: searchParams.get("actualExportEndDate") || "",
  });

  // Sync filters with URL
  useEffect(() => {
    const urlFilters = {
      localDeliveryStatus: searchParams.get("localDeliveryStatus") || "",
      orderWorkflowStatus: searchParams.get("orderWorkflowStatus") || "",
      priority: searchParams.get("priority") || "",
      machineType: searchParams.get("machineType") || "",
      saleType: searchParams.get("saleType") || "",
      region: searchParams.get("region") || "",
      provinceSearch: searchParams.get("province") || "",
      reqDeliveryStartDate: searchParams.get("reqDeliveryStartDate") || "",
      reqDeliveryEndDate: searchParams.get("reqDeliveryEndDate") || "",
      actualExportStartDate: searchParams.get("actualExportStartDate") || "",
      actualExportEndDate: searchParams.get("actualExportEndDate") || "",
    };

    if (JSON.stringify(filters) !== JSON.stringify(urlFilters)) {
      setFilters(urlFilters);
    }
  }, [searchParams]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    updateSearchParams({
      page: 1, // Reset to page 1 when filter changes
      ...updated,
      province: updated.provinceSearch, // remap provinceSearch to province in URL
    });
  };

  // Options cho các trường select
  const machineTypeOptions = ["Máy mới", "Máy cũ"];
  const regionOptions = ["Miền Bắc", "Miền Trung", "Miền Nam"];
  const priorityOptions = ["Thường", "Gấp", "Rất Gấp"];
  const deliveryStatusOptions = ["Chưa giao", "Đã giao", "Chưa giao hết"];
  const saleTypeOptions = ["Bán", "Cho thuê", "Cho mượn", "Đổi"];

  // Workflow status options for filter
  const workflowStatusOptions = Object.entries(ORDER_WORKFLOW_STATUS).map(
    ([key, value]) => ({
      value: key,
      label: value.label,
    }),
  );

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "",
  ).length;

  // Apply filters to orders (client-side)
  const filteredOrders = orders.filter((order) => {
    if (
      filters.orderWorkflowStatus &&
      (order.orderWorkflowStatus || "draft") !== filters.orderWorkflowStatus
    ) {
      return false;
    }
    if (
      filters.localDeliveryStatus &&
      order.localDeliveryStatus !== filters.localDeliveryStatus
    ) {
      return false;
    }
    if (filters.priority && order.priority !== filters.priority) {
      return false;
    }
    if (filters.machineType && order.machineType !== filters.machineType) {
      return false;
    }
    if (filters.saleType && order.saleType !== filters.saleType) {
      return false;
    }
    if (filters.region && order.region !== filters.region) {
      return false;
    }
    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    handleFilterChange({
      localDeliveryStatus: "",
      orderWorkflowStatus: "",
      priority: "",
      machineType: "",
      saleType: "",
      region: "",
      provinceSearch: "",
      reqDeliveryStartDate: "",
      reqDeliveryEndDate: "",
      actualExportStartDate: "",
      actualExportEndDate: "",
    });
  };

  // Badge configs với màu sắc
  const getBadgeConfig = (field: string, value: string | null) => {
    if (!value) return null;

    const configs: Record<
      string,
      Record<string, { bg: string; text: string; animation?: string }>
    > = {
      machineType: {
        "Máy mới": { bg: "bg-blue-100", text: "text-blue-700" },
        "Máy cũ": { bg: "bg-gray-100", text: "text-gray-700" },
      },
      priority: {
        Thường: { bg: "bg-gray-100", text: "text-gray-700" },
        Gấp: { bg: "bg-orange-100", text: "text-orange-700" },
        "Rất Gấp": { bg: "bg-red-100", text: "text-red-700" },
      },
      localDeliveryStatus: {
        "Chưa giao": { bg: "bg-yellow-100", text: "text-yellow-700" },
        "Đã giao": { bg: "bg-green-100", text: "text-green-700" },
        "Chưa giao hết": { bg: "bg-red-100", text: "text-red-700" },
      },
      saleType: {
        Bán: { bg: "bg-blue-100", text: "text-blue-700" },
        "Cho thuê": { bg: "bg-purple-100", text: "text-purple-700" },
        "Cho mượn": { bg: "bg-orange-100", text: "text-orange-700" },
        Đổi: { bg: "bg-teal-100", text: "text-teal-700" },
      },
      region: {
        "Miền Bắc": { bg: "bg-sky-100", text: "text-sky-700" },
        "Miền Trung": { bg: "bg-amber-100", text: "text-amber-700" },
        "Miền Nam": { bg: "bg-emerald-100", text: "text-emerald-700" },
      },
    };

    return configs[field]?.[value] || null;
  };

  // Render badge với màu sắc
  const renderBadge = (field: string, value: string | null) => {
    if (!value)
      return (
        <span className="text-gray-400 italic text-[13px]">Chưa chọn</span>
      );

    const config = getBadgeConfig(field, value);
    if (!config) return <span className="text-[13px]">{value}</span>;

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[13px] font-medium ${config.bg} ${config.text} ${config.animation || ""}`}
      >
        {value}
      </span>
    );
  };

  // Render workflow status badge
  const getWorkflowStatusBadge = (status: string) => {
    const statusConfig =
      ORDER_WORKFLOW_STATUS[status as keyof typeof ORDER_WORKFLOW_STATUS];
    if (!statusConfig)
      return <span className="text-gray-400 text-[11px]">{status}</span>;

    const colorClasses: Record<string, string> = {
      gray: "bg-gray-100 text-gray-700",
      yellow: "bg-yellow-100 text-yellow-700",
      blue: "bg-blue-100 text-blue-700",
      indigo: "bg-indigo-100 text-indigo-700",
      purple: "bg-purple-100 text-purple-700",
      pink: "bg-pink-100 text-pink-700",
      green: "bg-green-100 text-green-700",
      red: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[13px] font-medium ${colorClasses[statusConfig.color]}`}
      >
        {statusConfig.label}
      </span>
    );
  };

  // Open workflow modal
  const openWorkflowModal = (type: WorkflowActionType, order: MisaSaOrder) => {
    setWorkflowModal({ type, order, note: "", loading: false });
  };

  // Close workflow modal
  const closeWorkflowModal = () => {
    setWorkflowModal({ type: null, order: null, note: "", loading: false });
  };

  // Handle workflow action confirm
  const handleWorkflowConfirm = async () => {
    if (!workflowModal.order || !workflowModal.type) return;

    const { type, order, note } = workflowModal;

    // Validate required note for reject
    if (type === "reject" && !note.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setWorkflowModal((prev) => ({ ...prev, loading: true }));

    try {
      let result;
      let successMessage = "";

      switch (type) {
        case "submit":
          result = await misaDataSourceApi.submitOrderForApproval(order.id);
          successMessage = "Gửi duyệt thành công";
          break;
        case "approve":
          result = await misaDataSourceApi.approveOrRejectOrder(
            order.id,
            true,
            note.trim() || undefined,
          );
          successMessage = "Duyệt đơn hàng thành công";
          break;
        case "reject":
          result = await misaDataSourceApi.approveOrRejectOrder(
            order.id,
            false,
            note.trim(),
          );
          successMessage = "Từ chối đơn hàng thành công";
          break;
        case "resubmit":
          result = await misaDataSourceApi.submitOrderForApproval(order.id);
          successMessage = "Gửi lại đơn hàng thành công";
          break;
      }

      if (result?.success && result?.order) {
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, ...result.order! } : o)),
        );
        if (selectedOrder?.id === order.id) {
          setSelectedOrder({ ...selectedOrder, ...result.order });
        }
        toast.success(result.message || successMessage);
        closeWorkflowModal();
      } else {
        toast.error(result?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Có lỗi xảy ra";
      toast.error(errorMessage);
    } finally {
      setWorkflowModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Get modal config based on action type
  const getWorkflowModalConfig = () => {
    switch (workflowModal.type) {
      case "submit":
        return {
          title: "Xác nhận gửi duyệt",
          description: `Bạn có chắc chắn muốn gửi đơn hàng "${workflowModal.order?.refNo}" cho BGĐ duyệt?`,
          confirmText: "Gửi duyệt",
          variant: "default" as const,
          showInput: false,
          inputRequired: false,
        };
      case "approve":
        return {
          title: "Xác nhận duyệt đơn hàng",
          description: `Bạn có chắc chắn muốn duyệt đơn hàng "${workflowModal.order?.refNo}"?`,
          confirmText: "Duyệt",
          variant: "default" as const,
          showInput: true,
          inputLabel: "Ghi chú (không bắt buộc)",
          inputPlaceholder: "Nhập ghi chú nếu có...",
          inputRequired: false,
        };
      case "reject":
        return {
          title: "Xác nhận từ chối đơn hàng",
          description: `Bạn có chắc chắn muốn từ chối đơn hàng "${workflowModal.order?.refNo}"?`,
          confirmText: "Từ chối",
          variant: "danger" as const,
          showInput: true,
          inputLabel: "Lý do từ chối",
          inputPlaceholder: "Nhập lý do từ chối đơn hàng...",
          inputRequired: true,
          inputError:
            workflowModal.type === "reject" && !workflowModal.note.trim()
              ? "Vui lòng nhập lý do từ chối"
              : "",
        };
      case "resubmit":
        return {
          title: "Xác nhận gửi lại đơn hàng",
          description: `Bạn có chắc chắn muốn gửi lại đơn hàng "${workflowModal.order?.refNo}" để duyệt?`,
          confirmText: "Gửi lại",
          variant: "default" as const,
          showInput: false,
          inputRequired: false,
        };
      default:
        return null;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format quantity (remove trailing zeros: 1.0000 -> 1, 1.5000 -> 1.5)
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

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  // Handle update local field
  const handleUpdateField = async (
    orderId: number,
    field: keyof MisaSaOrderLocalFieldsUpdate,
    value: string | null,
  ) => {
    setUpdating(true);
    try {
      // Xử lý đặc biệt cho needsAdditionalOrder (boolean)
      let fieldValue: string | boolean | null = value || null;
      if (field === "needsAdditionalOrder") {
        fieldValue = value === "true";
      }

      const updated = await misaDataSourceApi.updateSaOrderLocalFields(
        orderId,
        { [field]: fieldValue },
      );
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updated });
      }
      setEditingCell(null);
    } catch (error) {
      console.error("Error updating field:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Start editing cell
  const startEditing = (
    orderId: number,
    field: keyof MisaSaOrderLocalFieldsUpdate,
    currentValue: string | null,
  ) => {
    setEditingCell({ orderId, field });
    setEditValue(currentValue || "");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Save editing
  const saveEditing = () => {
    if (editingCell) {
      handleUpdateField(editingCell.orderId, editingCell.field, editValue);
    }
  };

  // Kiểm tra đơn hàng có thể sửa inline không
  const canEditInline = (_order: MisaSaOrder) => {
    return true;
  };

  // Render editable date cell
  const renderEditableDateCell = (
    order: MisaSaOrder,
    field: keyof MisaSaOrderLocalFieldsUpdate,
    width: string,
  ) => {
    const isEditing =
      editingCell?.orderId === order.id && editingCell?.field === field;
    const value = order[field as keyof MisaSaOrder] as string | null;
    const editable = canEditInline(order);

    if (isEditing && editable) {
      return (
        <td
          className={`px-1 py-0.5 border-r border-gray-200 ${width}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditing();
              if (e.key === "Escape") cancelEditing();
            }}
            className="w-full px-1 py-0.5 text-[12px] border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            disabled={updating}
          />
        </td>
      );
    }

    return (
      <td
        className={`px-2 py-1 border-r border-gray-200 ${width} ${editable ? "cursor-pointer hover:bg-blue-50" : ""}`}
        onClick={
          editable
            ? (e) => {
                e.stopPropagation();
                startEditing(order.id, field, formatDateForInput(value));
              }
            : undefined
        }
      >
        <div className="text-[13px] text-gray-900">
          {value ? (
            formatDate(value)
          ) : (
            <span className="text-gray-400 italic">
              {editable ? "Nhấn để nhập" : "-"}
            </span>
          )}
        </div>
      </td>
    );
  };

  // Render editable text cell
  const renderEditableTextCell = (
    order: MisaSaOrder,
    field: keyof MisaSaOrderLocalFieldsUpdate,
    width: string,
    placeholder?: string,
  ) => {
    const isEditing =
      editingCell?.orderId === order.id && editingCell?.field === field;
    const value = order[field as keyof MisaSaOrder] as string | null;
    const editable = canEditInline(order);

    let displayValue = order[field as keyof MisaSaOrder] as string | null;

    if (field === "province" && !displayValue) {
      displayValue = extractProvince(order.accountObjectAddress);
    }

    if (isEditing && editable) {
      return (
        <td
          className={`px-1 py-0.5 border-r border-gray-200 ${width}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditing();
              if (e.key === "Escape") cancelEditing();
            }}
            className="w-full px-1 py-0.5 text-[12px] border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            disabled={updating}
            placeholder={placeholder}
          />
        </td>
      );
    }

    return (
      <td
        className={`px-2 py-1 border-r border-gray-200 ${width} ${editable ? "cursor-pointer hover:bg-blue-50" : ""}`}
        onClick={
          editable
            ? (e) => {
                e.stopPropagation();
                startEditing(order.id, field, value);
              }
            : undefined
        }
        // onClick={() => {
        //   if (editable) {
        //     startEditing(order.id, field, displayValue || "");
        //   }
        // }}
      >
        <div className="text-[13px] text-gray-900 break-words">
          {value || (
            <span className="text-gray-400 italic">
              {/* {editable ? "Nhấn để nhập" : "-"} */}
              {displayValue || "-"}
            </span>
          )}
        </div>
      </td>
    );
  };

  // Render editable select cell với badge màu sắc
  const renderEditableSelectCell = (
    order: MisaSaOrder,
    field: keyof MisaSaOrderLocalFieldsUpdate,
    options: string[],
    width: string,
  ) => {
    const isEditing =
      editingCell?.orderId === order.id && editingCell?.field === field;
    const value = order[field as keyof MisaSaOrder] as string | null;
    const editable = canEditInline(order);

    if (isEditing && editable) {
      return (
        <td
          className={`px-1 py-0.5 border-r border-gray-200 ${width}`}
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              handleUpdateField(order.id, field, e.target.value || null);
            }}
            onBlur={cancelEditing}
            className="w-full px-1 py-0.5 text-[12px] border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            disabled={updating}
          >
            <option value="">-- Chọn --</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </td>
      );
    }

    return (
      <td
        className={`px-2 py-1 border-r border-gray-200 ${width} ${editable ? "cursor-pointer hover:bg-blue-50" : ""}`}
        onClick={
          editable
            ? (e) => {
                e.stopPropagation();
                startEditing(order.id, field, value);
              }
            : undefined
        }
      >
        <div className="flex items-center">{renderBadge(field, value)}</div>
      </td>
    );
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await misaDataSourceApi.getSaOrders(
        page,
        limit,
        search || undefined,
        undefined,
        undefined,
        filters.provinceSearch || undefined,
        filters.reqDeliveryStartDate || undefined,
        filters.reqDeliveryEndDate || undefined,
        filters.actualExportStartDate || undefined,
        filters.actualExportEndDate || undefined,
      );
      setOrders(result.data);
      setTotal(result.total);
      // Auto select first order
      if (result.data.length > 0 && !selectedOrder) {
        setSelectedOrder(result.data[0]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    filters.provinceSearch,
    filters.reqDeliveryStartDate,
    filters.reqDeliveryEndDate,
    filters.actualExportStartDate,
    filters.actualExportEndDate,
  ]);

  // Fetch order details when selected order changes
  const fetchOrderDetails = useCallback(async (orderId: number) => {
    setLoadingDetails(true);
    try {
      const result = await misaDataSourceApi.getSaOrderWithDetails(orderId);
      setOrderDetails(result.details);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setOrderDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "sales-orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetails(selectedOrder.id);
    }
  }, [selectedOrder, fetchOrderDetails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ page: 1, search: search });
    setSelectedOrder(null);
  };

  // handleLimitChange is already defined above

  const handleSyncOrders = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setSyncDetails(null);
    setShowSyncDetails(false);
    try {
      const dataSource = await misaDataSourceApi.getByCode("sales_order");
      if (!dataSource) {
        setSyncMessage({
          type: "error",
          text: 'Không tìm thấy nguồn dữ liệu đơn bán hàng. Vui lòng tạo data source với code "sales_order" trong trang Quản lý kết nối MISA.',
        });
        return;
      }
      const result = (await misaDataSourceApi.startSync(dataSource.id)) as any;
      if (result.success) {
        const stats = result.syncStats;
        let message = `Kéo ${result.total || 0} bản ghi`;
        if (stats) {
          message = `Tổng: ${result.total || 0} | Mới: ${stats.created} | Cập nhật: ${stats.updated}`;
          if (stats.merged && stats.merged > 0) {
            message += ` | Merge thủ công: ${stats.merged}`;
          }
          if (stats.detailUpdated && stats.detailUpdated > 0) {
            message += ` | Chi tiết thay đổi: ${stats.detailUpdated}`;
          }
          message += ` | Không đổi: ${stats.unchanged}`;
          if (stats.errors > 0) {
            message += ` | Lỗi: ${stats.errors}`;
          }
        }
        setSyncMessage({
          type: "success",
          text: message,
          syncId: result.syncId,
        });
        setPage(1);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        setSyncMessage({
          type: "error",
          text: result.message || "Kéo dữ liệu thất bại",
          syncId: result.syncId,
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

  // Fetch sync details when user clicks "View Details"
  const handleViewSyncDetails = async () => {
    if (!syncMessage?.syncId) return;

    if (showSyncDetails) {
      // Toggle off
      setShowSyncDetails(false);
      return;
    }

    setLoadingSyncDetails(true);
    try {
      const history = await misaDataSourceApi.getSyncHistoryById(
        syncMessage.syncId,
      );
      if (history?.changedDetails) {
        setSyncDetails(history.changedDetails);
      }
      setShowSyncDetails(true);
    } catch (error) {
      console.error("Error fetching sync details:", error);
    } finally {
      setLoadingSyncDetails(false);
    }
  };

  // Clear sync message and details together
  const handleCloseSyncMessage = () => {
    setSyncMessage(null);
    setSyncDetails(null);
    setShowSyncDetails(false);
  };

  const handleRowClick = (order: MisaSaOrder) => {
    if (selectedOrder?.id === order.id) {
      // Same row clicked: toggle panel
      setShowDetailPanel((prev) => !prev);
    } else {
      setSelectedOrder(order);
      setDetailEditMode(false);
      setDetailEditValues({});
      setShowDetailPanel(true);
    }
  };

  // Start editing in detail panel (for non-draft orders)
  const startDetailEdit = () => {
    if (!selectedOrder) return;
    setDetailEditMode(true);
    setDetailEditValues({
      requestedDeliveryDate: selectedOrder.requestedDeliveryDate || null,
      actualExportDate: selectedOrder.actualExportDate || null,
      goodsStatus: selectedOrder.goodsStatus || null,
      machineType: selectedOrder.machineType || null,
      region: selectedOrder.region || null,
      priority: selectedOrder.priority || null,
      localDeliveryStatus: selectedOrder.localDeliveryStatus || null,
      saleType: selectedOrder.saleType || null,
      backDate: selectedOrder.backDate || null,
      receiverName: selectedOrder.receiverName || null,
      receiverPhone: selectedOrder.receiverPhone || null,
      specificAddress: selectedOrder.specificAddress || null,
      province: selectedOrder.province || null,
    });
  };

  // Cancel editing in detail panel
  const cancelDetailEdit = () => {
    setDetailEditMode(false);
    setDetailEditValues({});
  };

  // Save changes from detail panel
  const saveDetailEdit = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const updated = await misaDataSourceApi.updateSaOrderLocalFields(
        selectedOrder.id,
        detailEditValues,
      );
      // Update in list
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      // Update selected order
      setSelectedOrder(updated);
      setDetailEditMode(false);
      setDetailEditValues({});
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setUpdating(false);
    }
  };

  console.log(orders);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-3 flex-shrink-0">
        <button
          onClick={() => setActiveTab("sales-orders")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-[13px] border-b-2 transition-colors ${
            activeTab === "sales-orders"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Đơn bán hàng
        </button>
      </div>

      {/* Sales Orders Content */}
      {activeTab === "sales-orders" && (
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <MisaSearchBar
                placeholder="Tìm theo số đơn, tên khách hàng..."
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                onRefresh={fetchOrders}
                onSync={handleSyncOrders}
                loading={loading}
                syncing={syncing}
                compact
                provinceSearch={filters.provinceSearch}
                onProvinceSearchChange={(val) =>
                  handleFilterChange({ provinceSearch: val })
                }
              />
            </div>
            <button
              onClick={() => setShowManualOrderForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo đơn
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg border transition-colors ${
                activeFilterCount > 0
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Lọc
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-[11px] font-medium bg-blue-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-gray-700">
                  Bộ lọc
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[12px] text-red-600 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {/* Trạng thái */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={filters.orderWorkflowStatus}
                    onChange={(e) =>
                      handleFilterChange({
                        orderWorkflowStatus: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {workflowStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Tình trạng giao hàng
                  </label>
                  <select
                    value={filters.localDeliveryStatus}
                    onChange={(e) =>
                      handleFilterChange({
                        localDeliveryStatus: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option key={"done"} value={"Đã giao"}>
                      {"Đã giao"}
                    </option>
                    <option key={"undone"} value={"Chưa giao"}>
                      {"Chưa giao"}
                    </option>
                    <option key={"partially_done"} value={"Chưa giao hết"}>
                      {"Chưa giao hết"}
                    </option>
                  </select>
                </div>
                {/* Độ ưu tiên */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange({ priority: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {priorityOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Phân loại máy */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Phân loại máy
                  </label>
                  <select
                    value={filters.machineType}
                    onChange={(e) =>
                      handleFilterChange({ machineType: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {machineTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Loại bán/cho thuê */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Loại bán/cho thuê
                  </label>
                  <select
                    value={filters.saleType}
                    onChange={(e) =>
                      handleFilterChange({ saleType: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {saleTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Miền */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Miền
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) =>
                      handleFilterChange({ region: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {regionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ngày yêu cầu giao */}
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Ngày yêu cầu giao (Từ)
                  </label>
                  <input
                    type="date"
                    value={filters.reqDeliveryStartDate}
                    onChange={(e) =>
                      handleFilterChange({
                        reqDeliveryStartDate: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Ngày yêu cầu giao (Đến)
                  </label>
                  <input
                    type="date"
                    value={filters.reqDeliveryEndDate}
                    onChange={(e) =>
                      handleFilterChange({ reqDeliveryEndDate: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Ngày thực tế xuất kho */}
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Ngày thực tế xuất kho (Từ)
                  </label>
                  <input
                    type="date"
                    value={filters.actualExportStartDate}
                    onChange={(e) =>
                      handleFilterChange({
                        actualExportStartDate: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Ngày thực tế xuất kho (Đến)
                  </label>
                  <input
                    type="date"
                    value={filters.actualExportEndDate}
                    onChange={(e) =>
                      handleFilterChange({
                        actualExportEndDate: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

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
                {syncMessage.syncId && (
                  <button
                    onClick={handleViewSyncDetails}
                    className={`px-2 py-0.5 text-[12px] rounded border transition-colors ${
                      showSyncDetails
                        ? "bg-gray-200 border-gray-400 text-gray-700"
                        : syncMessage.type === "success"
                          ? "bg-green-200 border-green-400 hover:bg-green-300"
                          : "bg-red-200 border-red-400 hover:bg-red-300"
                    }`}
                    disabled={loadingSyncDetails}
                  >
                    {loadingSyncDetails ? (
                      <RefreshCw className="w-3 h-3 animate-spin inline" />
                    ) : showSyncDetails ? (
                      "Ẩn chi tiết"
                    ) : (
                      <>
                        <Eye className="w-3 h-3 inline mr-1" />
                        Xem chi tiết
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleCloseSyncMessage}
                  className="font-bold hover:opacity-70"
                >
                  ×
                </button>
              </div>

              {/* Sync Details Panel - Hiển thị đơn hàng mới/cập nhật */}
              {showSyncDetails && syncDetails && (
                <div className="mt-2 bg-white rounded-lg border border-gray-200 p-3 max-h-[200px] overflow-y-auto">
                  {/* Đơn hàng mới */}
                  {syncDetails.created.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[13px] font-medium text-green-700 mb-1.5 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Đơn hàng mới ({syncDetails.created.length})
                      </div>
                      <div className="space-y-1 pl-5">
                        {syncDetails.created.map((item, index) => (
                          <div
                            key={index}
                            className="text-[12px] text-gray-700"
                          >
                            <span className="font-medium text-blue-600">
                              {item.code}
                            </span>
                            {item.name && (
                              <span className="text-gray-500">
                                {" "}
                                - {item.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Đơn hàng cập nhật */}
                  {syncDetails.updated.length > 0 && (
                    <div>
                      <div className="text-[13px] font-medium text-blue-700 mb-1.5 flex items-center gap-1">
                        <RefreshCw className="w-4 h-4" />
                        Đơn hàng cập nhật ({syncDetails.updated.length})
                      </div>
                      <div className="space-y-1.5 pl-5">
                        {syncDetails.updated.map((item, index) => (
                          <div key={index} className="text-[12px]">
                            <div className="text-gray-700">
                              <span className="font-medium text-blue-600">
                                {item.code}
                              </span>
                              {item.name && (
                                <span className="text-gray-500">
                                  {" "}
                                  - {item.name}
                                </span>
                              )}
                            </div>
                            {item.changes &&
                              Object.keys(item.changes).length > 0 && (
                                <div className="text-[11px] text-gray-500 mt-0.5 pl-2">
                                  {Object.entries(item.changes)
                                    .slice(0, 3)
                                    .map(([field, change]) => (
                                      <span key={field} className="mr-2">
                                        {field}:{" "}
                                        <span className="line-through text-red-400">
                                          {String(change.old || "-")}
                                        </span>
                                        {" → "}
                                        <span className="text-green-600">
                                          {String(change.new || "-")}
                                        </span>
                                      </span>
                                    ))}
                                  {Object.keys(item.changes).length > 3 && (
                                    <span className="text-gray-400">
                                      +{Object.keys(item.changes).length - 3}{" "}
                                      thay đổi khác
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Đơn hàng merge từ thủ công */}
                  {syncDetails.merged && syncDetails.merged.length > 0 && (
                    <div
                      className={
                        syncDetails.created.length > 0 ||
                        syncDetails.updated.length > 0
                          ? "mt-3"
                          : ""
                      }
                    >
                      <div className="text-[13px] font-medium text-orange-700 mb-1.5 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Merge từ đơn thủ công ({syncDetails.merged.length})
                      </div>
                      <div className="space-y-1 pl-5">
                        {syncDetails.merged.map((item, index) => (
                          <div
                            key={index}
                            className="text-[12px] text-gray-700"
                          >
                            <span className="font-medium text-orange-600">
                              {item.code}
                            </span>
                            {item.name && (
                              <span className="text-gray-500">
                                {" "}
                                - {item.name}
                              </span>
                            )}
                            <div className="text-[11px] text-gray-500 mt-0.5 pl-2">
                              refId:{" "}
                              <span className="line-through text-red-400">
                                {item.oldRefId?.slice(0, 8)}...
                              </span>
                              {" → "}
                              <span className="text-green-600">
                                {item.newRefId?.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Đơn có chi tiết thay đổi */}
                  {syncDetails.detailUpdated &&
                    syncDetails.detailUpdated.length > 0 && (
                      <div
                        className={
                          syncDetails.created.length > 0 ||
                          syncDetails.updated.length > 0
                            ? "mt-3"
                            : ""
                        }
                      >
                        <div className="text-[13px] font-medium text-purple-700 mb-1.5 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          Chi tiết thay đổi ({syncDetails.detailUpdated.length})
                        </div>
                        <div className="space-y-1 pl-5">
                          {syncDetails.detailUpdated.map((item, index) => (
                            <div
                              key={index}
                              className="text-[12px] text-gray-700"
                            >
                              <span className="font-medium text-blue-600">
                                {item.code}
                              </span>
                              {item.name && (
                                <span className="text-gray-500">
                                  {" "}
                                  - {item.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Không có thay đổi */}
                  {syncDetails.created.length === 0 &&
                    syncDetails.updated.length === 0 &&
                    (!syncDetails.merged || syncDetails.merged.length === 0) &&
                    (!syncDetails.detailUpdated ||
                      syncDetails.detailUpdated.length === 0) && (
                      <div className="text-[13px] text-gray-500 text-center py-2">
                        Không có đơn hàng nào được tạo mới hoặc cập nhật
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Orders List */}
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col min-h-0 overflow-hidden flex-1">
            {/* Header with total */}
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <span className="text-[13px] font-medium text-gray-700">
                {activeFilterCount > 0 ? (
                  <>
                    Hiển thị:{" "}
                    <span className="text-blue-600 font-bold">
                      {filteredOrders.length}
                    </span>{" "}
                    / {total} đơn hàng
                  </>
                ) : (
                  <>
                    Tổng:{" "}
                    <span className="text-blue-600 font-bold">{total}</span> đơn
                    hàng
                  </>
                )}
              </span>
            </div>

            <div className="overflow-x-auto flex-1 relative">
              <table
                className="w-full border-collapse table-fixed"
                style={{ minWidth: "1270px" }}
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
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky left-[290px] top-0 bg-gray-50 z-30 border-r border-gray-200 w-[100px]">
                      Độ ưu tiên
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Ngày yêu cầu giao
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Ngày thực tế xuất kho
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[200px]">
                      Tình trạng hàng hóa/Ghi chú
                    </th>
                    <th className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[70px]">
                      Cần đặt
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[200px]">
                      Ghi chú đặt thêm
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Phân loại máy
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[180px]">
                      Tên khách hàng
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[120px]">
                      Kinh doanh
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[120px]">
                      Người tạo đơn
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[200px]">
                      Diễn giải
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Khu vực
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Tình trạng giao hàng
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Loại bán/cho thuê
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Số ngày cho mượn/thuê (nếu có)
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      Người nhận
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[100px]">
                      SĐT người nhận
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[200px]">
                      Địa chỉ nhận
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[200px]">
                      Địa chỉ cụ thể
                    </th>
                    <th className="px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider sticky top-0 bg-gray-50 z-20 border-r border-gray-200 w-[120px]">
                      Tỉnh/TP
                    </th>
                    <th className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider sticky right-0 top-0 bg-gray-50 z-30 border-l border-gray-200 w-[80px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={21} className="px-4 py-6 text-center">
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-1" />
                        <span className="text-[13px] text-gray-500">
                          Đang tải...
                        </span>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={21} className="px-4 py-6 text-center">
                        <ShoppingCart className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-[13px] text-gray-500">
                          {activeFilterCount > 0
                            ? "Không có đơn hàng phù hợp với bộ lọc"
                            : "Chưa có đơn hàng nào"}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isUrgent = order.priority === "Rất Gấp";
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <tr
                          key={order.id}
                          onClick={() => handleRowClick(order)}
                          className={`cursor-pointer group ${
                            isSelected
                              ? "bg-blue-50"
                              : isUrgent
                                ? "bg-red-50 hover:bg-red-100"
                                : "hover:bg-gray-50"
                          }`}
                        >
                          <td
                            className={`px-2 py-1 text-[13px] border-r border-gray-200 sticky left-0 z-10 w-[90px] ${
                              isSelected
                                ? "bg-blue-50"
                                : isUrgent
                                  ? "bg-red-50 group-hover:bg-red-100"
                                  : "bg-white group-hover:bg-gray-50"
                            }`}
                          >
                            {formatDate(order.refDate)}
                          </td>
                          <td
                            className={`px-2 py-1 border-r border-gray-200 sticky left-[90px] z-10 w-[100px] ${
                              isSelected
                                ? "bg-blue-50"
                                : isUrgent
                                  ? "bg-red-50 group-hover:bg-red-100"
                                  : "bg-white group-hover:bg-gray-50"
                            }`}
                          >
                            <div className="text-[13px] text-gray-900">
                              {order.refNo}
                            </div>
                          </td>
                          <td
                            className={`px-2 py-1 border-r border-gray-200 sticky left-[190px] z-10 w-[100px] ${
                              isSelected
                                ? "bg-blue-50"
                                : isUrgent
                                  ? "bg-red-50 group-hover:bg-red-100"
                                  : "bg-white group-hover:bg-gray-50"
                            }`}
                          >
                            {getWorkflowStatusBadge(
                              order.orderWorkflowStatus || "draft",
                            )}
                          </td>
                          <td
                            className={`px-2 py-1 border-r border-gray-200 sticky left-[290px] z-10 w-[100px] ${
                              canEditInline(order)
                                ? "cursor-pointer hover:bg-blue-50"
                                : ""
                            } ${
                              isSelected
                                ? "bg-blue-50"
                                : isUrgent
                                  ? "bg-red-50 group-hover:bg-red-100"
                                  : "bg-white group-hover:bg-gray-50"
                            }`}
                            onClick={
                              canEditInline(order)
                                ? (e) => {
                                    e.stopPropagation();
                                    startEditing(
                                      order.id,
                                      "priority",
                                      order.priority,
                                    );
                                  }
                                : undefined
                            }
                          >
                            {editingCell?.orderId === order.id &&
                            editingCell?.field === "priority" &&
                            canEditInline(order) ? (
                              <select
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value);
                                  handleUpdateField(
                                    order.id,
                                    "priority",
                                    e.target.value || null,
                                  );
                                }}
                                onBlur={cancelEditing}
                                className="w-full px-1 py-0.5 text-[12px] border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                                disabled={updating}
                              >
                                <option value="">-- Chọn --</option>
                                {priorityOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center">
                                {renderBadge("priority", order.priority)}
                              </div>
                            )}
                          </td>
                          {renderEditableDateCell(
                            order,
                            "requestedDeliveryDate",
                            "w-[100px]",
                          )}
                          {renderEditableDateCell(
                            order,
                            "actualExportDate",
                            "w-[100px]",
                          )}
                          {renderEditableTextCell(
                            order,
                            "goodsStatus",
                            "w-[200px]",
                            "Nhập ghi chú...",
                          )}
                          {/* Cột checkbox Cần đặt thêm - cho phép sửa với đơn draft */}
                          <td
                            className={`px-2 py-1 border-r border-gray-200 w-[70px] text-center ${canEditInline(order) ? "cursor-pointer hover:bg-orange-50" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canEditInline(order) && !updating) {
                                handleUpdateField(
                                  order.id,
                                  "needsAdditionalOrder",
                                  !order.needsAdditionalOrder
                                    ? "true"
                                    : "false",
                                );
                              }
                            }}
                          >
                            {canEditInline(order) ? (
                              <input
                                type="checkbox"
                                checked={order.needsAdditionalOrder || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (!updating) {
                                    handleUpdateField(
                                      order.id,
                                      "needsAdditionalOrder",
                                      e.target.checked ? "true" : "false",
                                    );
                                  }
                                }}
                                disabled={updating}
                                className={`w-4 h-4 rounded ${order.needsAdditionalOrder ? "text-orange-600 accent-orange-600" : "text-gray-400"} focus:ring-orange-500 cursor-pointer`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : order.needsAdditionalOrder ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-100 text-orange-600 rounded-full">
                                ✓
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          {/* Cột ghi chú đặt thêm - cho phép sửa với đơn draft */}
                          {canEditInline(order) ? (
                            renderEditableTextCell(
                              order,
                              "additionalOrderNote",
                              "w-[200px]",
                              "Nhập ghi chú đặt thêm...",
                            )
                          ) : (
                            <td className="px-2 py-1 border-r border-gray-200 w-[200px]">
                              <div className="text-[13px] text-gray-900 break-words">
                                {order.additionalOrderNote || (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          )}
                          {renderEditableSelectCell(
                            order,
                            "machineType",
                            machineTypeOptions,
                            "w-[100px]",
                          )}
                          <td className="px-2 py-1 border-r border-gray-200 w-[180px]">
                            <div className="text-[13px] text-gray-900 break-words">
                              {order.accountObjectName || "-"}
                            </div>
                          </td>
                          <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[120px] break-words">
                            {order.employeeName || "-"}
                          </td>
                          <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[120px] break-words">
                            {order.createdBy || "-"}
                          </td>
                          <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[200px] break-words">
                            {order.journalMemo || "-"}
                          </td>
                          {renderEditableSelectCell(
                            order,
                            "region",
                            regionOptions,
                            "w-[100px]",
                          )}
                          {renderEditableSelectCell(
                            order,
                            "localDeliveryStatus",
                            deliveryStatusOptions,
                            "w-[100px]",
                          )}
                          {renderEditableSelectCell(
                            order,
                            "saleType",
                            saleTypeOptions,
                            "w-[100px]",
                          )}
                          {renderEditableTextCell(
                            order,
                            "backDate",
                            "w-[100px]",
                            "Số ngày trả hàng...",
                          )}
                          {renderEditableTextCell(
                            order,
                            "receiverName",
                            "w-[100px]",
                            "Tên người nhận",
                          )}
                          {renderEditableTextCell(
                            order,
                            "receiverPhone",
                            "w-[100px]",
                            "SĐT",
                          )}
                          <td className="px-2 py-1 text-[13px] border-r border-gray-200 w-[200px] break-words">
                            {order.accountObjectAddress || "-"}
                          </td>
                          {renderEditableTextCell(
                            order,
                            "specificAddress",
                            "w-[200px]",
                            "Nhập địa chỉ cụ thể...",
                          )}
                          {renderEditableTextCell(
                            order,
                            "province",
                            "w-[120px]",
                            "Tỉnh/TP...",
                          )}
                          <td
                            className={`px-2 py-1 text-center sticky right-0 z-10 border-l border-gray-200 w-[80px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                              isSelected
                                ? "bg-blue-50"
                                : isUrgent
                                  ? "bg-red-50 group-hover:bg-red-100"
                                  : "bg-white group-hover:bg-gray-50"
                            }`}
                            onClick={async (e) => {
                              if (!order.province) {
                                const autoProvince = extractProvince(
                                  order.accountObjectAddress,
                                );
                                if (autoProvince) {
                                  try {
                                    // Lưu ngầm xuống database trước khi chuyển trang
                                    await misaDataSourceApi.updateSaOrderLocalFields(
                                      order.id,
                                      {
                                        province: autoProvince,
                                      },
                                    );

                                    // Cập nhật lại state ở trang cha để đồng bộ (tùy chọn)
                                    setOrders((prev) =>
                                      prev.map((o) =>
                                        o.id === order.id
                                          ? { ...o, province: autoProvince }
                                          : o,
                                      ),
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Lỗi tự động lưu tỉnh:",
                                      error,
                                    );
                                  }
                                }
                              }
                              e.stopPropagation();
                            }}
                          >
                            <ActionsDropdown
                              actions={[
                                {
                                  label: "Xem chi tiết",
                                  icon: <Eye className="w-4 h-4" />,
                                  onClick: () =>
                                    navigate(
                                      `/quan-ly/don-hang-misa/${order.id}`,
                                    ),
                                },
                                ...(order.orderWorkflowStatus === "draft" ||
                                !order.orderWorkflowStatus
                                  ? [
                                      {
                                        label: "Gửi BGD",
                                        icon: <Send className="w-4 h-4" />,
                                        onClick: () =>
                                          openWorkflowModal("submit", order),
                                      },
                                    ]
                                  : []),
                                ...(order.orderWorkflowStatus ===
                                "waiting_approval"
                                  ? [
                                      {
                                        label: "Duyệt",
                                        icon: (
                                          <CheckCircle className="w-4 h-4" />
                                        ),
                                        onClick: () =>
                                          openWorkflowModal("approve", order),
                                      },
                                    ]
                                  : []),
                                ...(order.orderWorkflowStatus ===
                                "waiting_approval"
                                  ? [
                                      {
                                        label: "Từ chối",
                                        icon: <XCircle className="w-4 h-4" />,
                                        onClick: () =>
                                          openWorkflowModal("reject", order),
                                        variant: "danger" as const,
                                      },
                                    ]
                                  : []),
                                ...(order.orderWorkflowStatus === "rejected"
                                  ? [
                                      {
                                        label: "Gửi lại",
                                        icon: <RotateCcw className="w-4 h-4" />,
                                        onClick: () =>
                                          openWorkflowModal("resubmit", order),
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
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            )}
          </div>

          {/* Order Details Panel - inline collapsible */}
          {showDetailPanel && selectedOrder && (
            <div
              className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden flex-shrink-0"
              style={{ height: "38vh" }}
            >
              <>
                {/* Detail Header */}
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-[13px] font-medium text-gray-900">
                      {detailEditMode ? "Sửa thông tin: " : "Sản phẩm đơn: "}
                      <span className="text-blue-600">
                        {selectedOrder.refNo}
                      </span>
                    </span>
                    {!detailEditMode && (
                      <span className="text-[12px] text-gray-500">
                        ({orderDetails.length} sản phẩm)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Edit/Save/Cancel buttons for non-draft orders */}
                    {!canEditInline(selectedOrder) && (
                      <div className="flex items-center gap-1">
                        {detailEditMode ? (
                          <>
                            <button
                              onClick={cancelDetailEdit}
                              disabled={updating}
                              className="px-2 py-0.5 text-[12px] text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={saveDetailEdit}
                              disabled={updating}
                              className="px-2 py-0.5 text-[12px] text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
                            >
                              {updating && (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              )}
                              Lưu
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={startDetailEdit}
                            className="px-2 py-0.5 text-[12px] text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Sửa
                          </button>
                        )}
                      </div>
                    )}
                    {/* Close / hide panel button */}
                    <button
                      onClick={() => setShowDetailPanel(false)}
                      title="Ẩn sản phẩm"
                      className="ml-1 flex items-center justify-center w-6 h-6 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Form - shows when detailEditMode is true */}
                {detailEditMode && !canEditInline(selectedOrder) && (
                  <div className="p-3 border-b border-gray-200 bg-blue-50/50 overflow-auto">
                    <div className="grid grid-cols-4 gap-3 text-[12px]">
                      {/* Row 1 */}
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Độ ưu tiên
                        </label>
                        <select
                          value={detailEditValues.priority || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              priority: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn --</option>
                          {priorityOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Phân loại máy
                        </label>
                        <select
                          value={detailEditValues.machineType || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              machineType: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn --</option>
                          {machineTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Loại bán/thuê
                        </label>
                        <select
                          value={detailEditValues.saleType || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              saleType: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn --</option>
                          {saleTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Khu vực
                        </label>
                        <select
                          value={detailEditValues.region || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              region: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn --</option>
                          {regionOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Row 2 */}
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Ngày yêu cầu giao
                        </label>
                        <input
                          type="date"
                          value={
                            detailEditValues.requestedDeliveryDate
                              ? formatDateForInput(
                                  detailEditValues.requestedDeliveryDate,
                                )
                              : ""
                          }
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              requestedDeliveryDate: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Ngày xuất kho
                        </label>
                        <input
                          type="date"
                          value={
                            detailEditValues.actualExportDate
                              ? formatDateForInput(
                                  detailEditValues.actualExportDate,
                                )
                              : ""
                          }
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              actualExportDate: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Tình trạng giao
                        </label>
                        <select
                          value={detailEditValues.localDeliveryStatus || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              localDeliveryStatus: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn --</option>
                          {deliveryStatusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Ghi chú hàng
                        </label>
                        <input
                          type="text"
                          value={detailEditValues.goodsStatus || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              goodsStatus: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Nhập ghi chú..."
                        />
                      </div>
                      {/* Row 3 */}
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Người nhận
                        </label>
                        <input
                          type="text"
                          value={detailEditValues.receiverName || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              receiverName: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Tên người nhận..."
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          SĐT người nhận
                        </label>
                        <input
                          type="text"
                          value={detailEditValues.receiverPhone || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              receiverPhone: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Số điện thoại..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-gray-600 mb-1">
                          Địa chỉ cụ thể
                        </label>
                        <input
                          type="text"
                          value={detailEditValues.specificAddress || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              specificAddress: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Địa chỉ giao hàng cụ thể..."
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Tỉnh/Thành phố
                        </label>
                        <input
                          type="text"
                          value={detailEditValues.province || ""}
                          onChange={(e) =>
                            setDetailEditValues((prev) => ({
                              ...prev,
                              province: e.target.value || null,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Tỉnh/Thành phố..."
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                        <th className="px-2 py-1.5 text-left text-[11px] font-medium text-gray-500 uppercase w-[70px] border-r border-gray-200">
                          Kho
                        </th>
                        <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[80px] border-r border-gray-200">
                          SL
                        </th>
                        <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[80px] border-r border-gray-200">
                          Đơn vị
                        </th>
                        <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[100px] border-r border-gray-200">
                          Đơn giá
                        </th>
                        <th className="px-2 py-1.5 text-right text-[11px] font-medium text-gray-500 uppercase w-[110px]">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center">
                            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : orderDetails.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
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
                            <td className="px-2 py-1 text-gray-600 border-r border-gray-200">
                              {item.stockCode || "-"}
                            </td>
                            <td className="px-2 py-1 text-right border-r border-gray-200">
                              {item.isDescription
                                ? "-"
                                : formatQuantity(item.quantity)}
                            </td>
                            <td className="px-2 py-1 text-right border-r border-gray-200">
                              {item.isDescription ? "-" : item.unitName || "-"}
                            </td>
                            <td className="px-2 py-1 text-right border-r border-gray-200">
                              {item.isDescription
                                ? "-"
                                : formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-2 py-1 text-right font-medium">
                              {item.isDescription
                                ? "-"
                                : formatCurrency(item.amountOc)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {orderDetails.length > 0 && (
                      <tfoot className="bg-gray-50 sticky bottom-0">
                        <tr>
                          <td
                            colSpan={7}
                            className="px-2 py-1.5 text-right font-medium border-t border-gray-200"
                          >
                            Tổng cộng:
                          </td>
                          <td className="px-2 py-1.5 text-right font-bold text-blue-600 border-t border-gray-200">
                            {formatCurrency(
                              orderDetails.reduce((sum, item) => {
                                if (item.isDescription) return sum;
                                const amount = Number(item.amountOc) || 0;
                                return sum + amount;
                              }, 0),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            </div>
          )}
        </div>
      )}

      {/* Manual Order Form Modal */}
      <ManualOrderForm
        isOpen={showManualOrderForm}
        onClose={() => setShowManualOrderForm(false)}
        onSuccess={() => {
          setPage(1);
          fetchOrders();
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
