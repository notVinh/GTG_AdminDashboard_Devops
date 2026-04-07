import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  Truck,
  RefreshCw,
  Hash,
  Building,
  CreditCard,
  ClipboardList,
  AlertTriangle,
  Phone,
  Send,
  Pencil,
  X,
  XCircle,
  Save,
  Plus,
  Users,
  Play,
  Repeat,
  MessageSquare,
  Image,
  ChevronDown,
  ChevronUp,
  Trash2,
  Timer,
} from "lucide-react";
import {
  misaDataSourceApi,
  type MisaSaOrder,
  type MisaSaOrderDetail,
  type MisaSaOrderLocalFieldsUpdate,
  type MisaSaOrderAssignment,
  type MisaSaOrderTaskReport,
  ORDER_WORKFLOW_STATUS,
  TASK_TYPE_LABELS,
  ASSIGNMENT_STATUS,
  ASSIGNMENT_STATUS_LABELS,
  REPORT_TYPE,
  REPORT_TYPE_LABELS,
  REPORT_STATUS,
  REPORT_STATUS_LABELS,
  getTaskTypeFromWorkflowStatus,
  getTaskTypesFromWorkflowStatus,
  canAssignTask,
} from "../../api/misa-data-source";
import { employeeApi } from "../../api/employee";
import { filesApi } from "../../api/files";
import type { EmployeeWithDetails } from "../../types";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Component riêng cho phần Đặt thêm hàng - luôn cho phép edit
function AdditionalOrderSection({
  order,
  onUpdate,
}: {
  order: MisaSaOrder;
  onUpdate: (order: MisaSaOrder) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [needsAdditionalOrder, setNeedsAdditionalOrder] = useState(
    order.needsAdditionalOrder || false,
  );
  const [additionalOrderNote, setAdditionalOrderNote] = useState(
    order.additionalOrderNote || "",
  );
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Sync state khi order thay đổi từ bên ngoài
  useEffect(() => {
    setNeedsAdditionalOrder(order.needsAdditionalOrder || false);
    setAdditionalOrderNote(order.additionalOrderNote || "");
  }, [order.needsAdditionalOrder, order.additionalOrderNote]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await misaDataSourceApi.updateSaOrderLocalFields(
        order.id,
        {
          needsAdditionalOrder,
          additionalOrderNote: needsAdditionalOrder
            ? additionalOrderNote || null
            : null,
        },
      );
      onUpdate(updated);
      setIsEditing(false);
      toast.success("Đã cập nhật thông tin đặt thêm hàng");
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNeedsAdditionalOrder(order.needsAdditionalOrder || false);
    setAdditionalOrderNote(order.additionalOrderNote || "");
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-600" />
          Thông tin đặt thêm hàng
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Sửa
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsAdditionalOrder}
                onChange={(e) => setNeedsAdditionalOrder(e.target.checked)}
                className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-orange-800">
                Cần đặt thêm hàng
              </span>
            </label>
          </div>
          {needsAdditionalOrder && (
            <div>
              <label className="text-orange-700 text-sm mb-1 block">
                Ghi chú đặt thêm hàng:
              </label>
              <textarea
                value={additionalOrderNote}
                onChange={(e) => setAdditionalOrderNote(e.target.value)}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                rows={2}
                placeholder="Nhập nội dung chi tiết về hàng cần đặt thêm..."
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`rounded-lg p-4 ${
            order.needsAdditionalOrder
              ? "bg-orange-50 border border-orange-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {order.needsAdditionalOrder ? (
              <>
                <CheckCircle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  Cần đặt thêm hàng
                </span>
              </>
            ) : (
              <>
                <span className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">
                  -
                </span>
                <span className="text-gray-500">Không cần đặt thêm hàng</span>
              </>
            )}
          </div>
          {order.additionalOrderNote && (
            <p className="mt-2 text-sm text-gray-700 ml-7">
              {order.additionalOrderNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Component quản lý giao việc
type AssignmentSectionProps = {
  order: MisaSaOrder;
  assignments: MisaSaOrderAssignment[];
  onRefreshAssignments: (newAssignments?: MisaSaOrderAssignment[]) => void;
  canAssign: boolean;
  canResume: boolean; // Quyền bắt đầu lại công việc từ trạng thái tạm dừng
};

function AssignmentSection({
  order,
  assignments,
  onRefreshAssignments,
  canAssign,
  canResume,
}: AssignmentSectionProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState<number | null>(
    null,
  );

  // Create assignment state - taskType tự động xác định từ workflow status
  const [createData, setCreateData] = useState({
    assignedToIds: [] as number[],
    notes: "",
  });
  const [creating, setCreating] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Lấy danh sách loại công việc có thể giao từ trạng thái workflow
  const availableTaskTypes = getTaskTypesFromWorkflowStatus(
    order.orderWorkflowStatus || "",
  );
  const currentTaskType =
    availableTaskTypes.length > 0 ? availableTaskTypes[0] : null;
  const canCreateAssignment = canAssignTask(order.orderWorkflowStatus || "");

  // State để chọn loại công việc khi có nhiều option
  const [selectedTaskType, setSelectedTaskType] = useState<string>(
    currentTaskType || "",
  );

  // Reset selectedTaskType khi mở modal hoặc khi availableTaskTypes thay đổi
  useEffect(() => {
    if (showCreateModal && availableTaskTypes.length > 0 && !selectedTaskType) {
      setSelectedTaskType(availableTaskTypes[0]);
    }
  }, [showCreateModal, availableTaskTypes, selectedTaskType]);

  // Filter employees theo search
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = employeeSearch.toLowerCase();
    const fullName = emp.user?.fullName?.toLowerCase() || "";
    const email = emp.user?.email?.toLowerCase() || "";
    const phone = emp.user?.phone?.toLowerCase() || "";
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  // Toggle chọn nhân viên
  const toggleEmployee = (empId: number) => {
    setCreateData((prev) => ({
      ...prev,
      assignedToIds: prev.assignedToIds.includes(empId)
        ? prev.assignedToIds.filter((id) => id !== empId)
        : [...prev.assignedToIds, empId],
    }));
  };

  // Lấy tên nhân viên đã chọn
  const getSelectedEmployeeNames = () => {
    return createData.assignedToIds
      .map((id) => employees.find((e) => e.id === id)?.user?.fullName || "")
      .filter(Boolean)
      .join(", ");
  };

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] =
    useState<MisaSaOrderAssignment | null>(null);

  // Image lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Open lightbox with images
  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  // Navigate lightbox
  const prevImage = () => {
    setLightboxIndex((prev) =>
      prev > 0 ? prev - 1 : lightboxImages.length - 1,
    );
  };

  const nextImage = () => {
    setLightboxIndex((prev) =>
      prev < lightboxImages.length - 1 ? prev + 1 : 0,
    );
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxImages.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
        case "Escape":
          closeLightbox();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxImages.length]);

  // Gộp assignments theo taskType
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, MisaSaOrderAssignment[]> = {};
    assignments.forEach((assignment) => {
      if (!groups[assignment.taskType]) {
        groups[assignment.taskType] = [];
      }
      groups[assignment.taskType].push(assignment);
    });
    return groups;
  }, [assignments]);

  // Lấy trạng thái chung của nhóm: có ít nhất 1 người hoàn thành → nhóm hoàn thành
  const getGroupStatus = (groupAssignments: MisaSaOrderAssignment[]) => {
    // Nếu có ít nhất 1 người hoàn thành → nhóm được tính là hoàn thành
    if (groupAssignments.some((a) => a.status === ASSIGNMENT_STATUS.COMPLETED))
      return ASSIGNMENT_STATUS.COMPLETED;
    if (
      groupAssignments.some((a) => a.status === ASSIGNMENT_STATUS.IN_PROGRESS)
    )
      return ASSIGNMENT_STATUS.IN_PROGRESS;
    if (groupAssignments.some((a) => a.status === ASSIGNMENT_STATUS.BLOCKED))
      return ASSIGNMENT_STATUS.BLOCKED;
    if (groupAssignments.some((a) => a.status === ASSIGNMENT_STATUS.INCOMPLETE))
      return ASSIGNMENT_STATUS.INCOMPLETE;
    return ASSIGNMENT_STATUS.PENDING;
  };

  // State để track expanded groups
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Resume confirmation modal state
  const [showResumeConfirmModal, setShowResumeConfirmModal] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] =
    useState<MisaSaOrderAssignment | null>(null);
  const [reportGroupAssignments, setReportGroupAssignments] = useState<
    MisaSaOrderAssignment[]
  >([]); // Báo cáo cho cả nhóm
  const [reportData, setReportData] = useState({
    reportType: REPORT_TYPE.DAILY_PROGRESS as string,
    progressPercent: 50,
    description: "",
    blockedReason: "",
    status: REPORT_STATUS.IN_PROGRESS as string,
  });
  // State cho ảnh báo cáo
  const [reportPhotoFiles, setReportPhotoFiles] = useState<File[]>([]);
  const [reportPhotoPreviewUrls, setReportPhotoPreviewUrls] = useState<
    string[]
  >([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Tự động tính status từ progressPercent
  const getStatusFromProgress = (
    progress: number,
    reportType: string,
  ): string => {
    if (reportType === REPORT_TYPE.ISSUE) return REPORT_STATUS.BLOCKED;
    return progress >= 100
      ? REPORT_STATUS.COMPLETED
      : REPORT_STATUS.IN_PROGRESS;
  };

  // Reassign modal state
  const [showReassignModal, setShowReassignModal] =
    useState<MisaSaOrderAssignment | null>(null);
  const [reassignData, setReassignData] = useState({
    newAssignedToId: 0,
    reassignReason: "",
    scheduledAt: "",
    notes: "",
  });

  // Retry modal state - for retrying incomplete assignments
  const [showRetryModal, setShowRetryModal] = useState<{
    taskType: string;
    allAssignments: MisaSaOrderAssignment[];
  } | null>(null);
  const [retrySelectedIds, setRetrySelectedIds] = useState<number[]>([]);
  const [retryNotes, setRetryNotes] = useState("");
  // Thêm nhân viên mới vào giao việc lại
  const [retryNewEmployeeIds, setRetryNewEmployeeIds] = useState<number[]>([]);
  const [retryEmployeeSearch, setRetryEmployeeSearch] = useState("");
  const [showRetryEmployeeDropdown, setShowRetryEmployeeDropdown] =
    useState(false);

  // Filter employees cho retry modal - loại bỏ những người đã có assignment
  const retryFilteredEmployees = employees.filter((emp) => {
    // Loại bỏ những người đã có trong danh sách assignments
    const existingAssigneeIds =
      showRetryModal?.allAssignments.map((a) => a.assignedToId) || [];
    if (existingAssigneeIds.includes(emp.id)) return false;
    // Loại bỏ những người đã được chọn
    if (retryNewEmployeeIds.includes(emp.id)) return false;
    // Filter theo search
    const searchLower = retryEmployeeSearch.toLowerCase();
    const fullName = emp.user?.fullName?.toLowerCase() || "";
    const email = emp.user?.email?.toLowerCase() || "";
    const phone = emp.user?.phone?.toLowerCase() || "";
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  // Toggle chọn nhân viên mới trong retry modal
  const toggleRetryNewEmployee = (empId: number) => {
    setRetryNewEmployeeIds((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId],
    );
    // Không đóng dropdown và không xóa search - cho phép chọn nhiều
  };

  // Lấy tên nhân viên mới đã chọn trong retry modal
  const getRetryNewEmployeeNames = () => {
    return retryNewEmployeeIds.map((id) => {
      const emp = employees.find((e) => e.id === id);
      return emp?.user?.fullName || "N/A";
    });
  };

  // Reports for order (loaded when group is expanded)
  const [reports, setReports] = useState<MisaSaOrderTaskReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Load reports for entire order when group is expanded
  const loadOrderReports = useCallback(async () => {
    if (!order) return;
    setLoadingReports(true);
    try {
      const data = await misaDataSourceApi.getOrderReports(order.id);
      setReports(data);
    } catch (error) {
      console.error("Error fetching order reports:", error);
    } finally {
      setLoadingReports(false);
    }
  }, [order]);

  // Auto-load reports when group is expanded
  useEffect(() => {
    if (expandedGroup) {
      loadOrderReports();
    }
  }, [expandedGroup, loadOrderReports]);

  // Fetch employees for dropdown
  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      // Lấy tất cả nhân viên, không filter status
      const result = await employeeApi.listEmployeesWithDetails(1, 500, 0);
      setEmployees(result.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    if (showCreateModal || showReassignModal || showRetryModal) {
      fetchEmployees();
    }
  }, [showCreateModal, showReassignModal, showRetryModal, fetchEmployees]);

  // Fetch reports when expanding assignment
  const handleToggleExpand = async (assignmentId: number) => {
    if (expandedAssignment === assignmentId) {
      setExpandedAssignment(null);
      return;
    }
    setExpandedAssignment(assignmentId);
    setLoadingReports(true);
    try {
      const data = await misaDataSourceApi.getAssignmentReports(assignmentId);
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Create assignment - hỗ trợ giao việc cho nhiều nhân viên (1 API call)
  const handleCreate = async () => {
    if (createData.assignedToIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nhân viên");
      return;
    }
    if (!selectedTaskType) {
      toast.error("Vui lòng chọn loại công việc");
      return;
    }
    setCreating(true);
    try {
      // Gọi API 1 lần với assignedToIds array
      const results = await misaDataSourceApi.createAssignments(order.id, {
        taskType: selectedTaskType,
        assignedToIds: createData.assignedToIds,
        notes: createData.notes || undefined,
      });
      toast.success(`Đã giao việc cho ${results.length} nhân viên thành công`);
      setShowCreateModal(false);
      setCreateData({ assignedToIds: [], notes: "" });
      setEmployeeSearch("");
      setSelectedTaskType(availableTaskTypes[0] || "");
      onRefreshAssignments();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setCreating(false);
    }
  };

  // Start assignment
  const handleStart = async (assignment: MisaSaOrderAssignment) => {
    setActionLoading(assignment.id);
    try {
      const result = await misaDataSourceApi.startAssignment(assignment.id);
      toast.success("Đã bắt đầu công việc");
      onRefreshAssignments(result.assignments);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Resume assignment (bắt đầu lại sau khi tạm dừng)
  const handleResume = async (assignment: MisaSaOrderAssignment) => {
    setActionLoading(assignment.id);
    try {
      const result = await misaDataSourceApi.resumeAssignment(assignment.id);
      toast.success("Đã bắt đầu lại công việc");
      onRefreshAssignments(result.assignments);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Resume all blocked assignments (từ modal xác nhận)
  const handleResumeAllBlocked = async () => {
    const blockedAssignment = assignments.find(
      (a) => a.status === ASSIGNMENT_STATUS.BLOCKED,
    );
    if (!blockedAssignment) {
      toast.error("Không tìm thấy công việc đang tạm dừng");
      return;
    }

    setActionLoading(-2); // -2 để indicate resume all loading
    try {
      const result = await misaDataSourceApi.resumeAssignment(
        blockedAssignment.id,
      );
      // toast.success(result.message || "Đã bắt đầu lại công việc");
      toast.success("Đã bắt đầu lại công việc");
      setShowResumeConfirmModal(false);
      onRefreshAssignments(result.assignments);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Reassign
  const handleReassign = async () => {
    if (!showReassignModal || !reassignData.newAssignedToId) {
      toast.error("Vui lòng chọn nhân viên mới");
      return;
    }
    setActionLoading(showReassignModal.id);
    try {
      const result = await misaDataSourceApi.reassignTask(
        showReassignModal.id,
        {
          newAssignedToId: reassignData.newAssignedToId,
          reassignReason: reassignData.reassignReason || undefined,
          scheduledAt: reassignData.scheduledAt || undefined,
          notes: reassignData.notes || undefined,
        },
      );
      toast.success("Đã chuyển giao công việc");
      setShowReassignModal(null);
      setReassignData({
        newAssignedToId: 0,
        reassignReason: "",
        scheduledAt: "",
        notes: "",
      });
      onRefreshAssignments(result.assignments);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Retry task group - đánh dấu TẤT CẢ assignments cũ là REASSIGNED và tạo lần mới
  const handleRetryAssignments = async () => {
    const hasExisting = retrySelectedIds.length > 0;
    const hasNew = retryNewEmployeeIds.length > 0;

    if (!showRetryModal || (!hasExisting && !hasNew)) {
      toast.error("Vui lòng chọn ít nhất một nhân viên");
      return;
    }
    setActionLoading(-1); // Use -1 to indicate general loading
    try {
      // Chuyển assignment IDs thành employee IDs
      const retryEmployeeIds = retrySelectedIds
        .map((assignmentId) => {
          const assignment = showRetryModal.allAssignments.find(
            (a) => a.id === assignmentId,
          );
          return assignment?.assignedToId;
        })
        .filter((id): id is number => id !== undefined);

      // Gọi API mới - sẽ đánh dấu TẤT CẢ assignments cũ thành REASSIGNED
      const result = await misaDataSourceApi.retryTaskGroup(order.id, {
        taskType: showRetryModal.taskType,
        retryEmployeeIds,
        newEmployeeIds: retryNewEmployeeIds,
        notes: retryNotes || undefined,
      });

      const totalCount = retryEmployeeIds.length + retryNewEmployeeIds.length;
      toast.success(`Đã giao lại việc cho ${totalCount} nhân viên`);
      setShowRetryModal(null);
      setRetrySelectedIds([]);
      setRetryNewEmployeeIds([]);
      setRetryNotes("");
      setRetryEmployeeSearch("");
      onRefreshAssignments(result?.assignments);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Open retry modal with all assignments in the group
  const openRetryModal = (
    taskType: string,
    groupAssignments: MisaSaOrderAssignment[],
  ) => {
    const incompleteAssignments = groupAssignments.filter(
      (a) => a.status === ASSIGNMENT_STATUS.INCOMPLETE,
    );
    if (incompleteAssignments.length === 0) return;

    setShowRetryModal({ taskType, allAssignments: groupAssignments });
    // Pre-select only incomplete assignments
    setRetrySelectedIds(incompleteAssignments.map((a) => a.id));
    setRetryNotes("");
  };

  // Delete assignment - xác nhận bằng modal
  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return;

    setActionLoading(showDeleteModal.id);
    try {
      await misaDataSourceApi.deleteAssignment(showDeleteModal.id);
      toast.success("Đã xóa giao việc");
      setShowDeleteModal(null);
      onRefreshAssignments();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Xử lý chọn ảnh cho báo cáo
  const handleReportPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Giới hạn 5 ảnh
    const totalFiles = reportPhotoFiles.length + files.length;
    if (totalFiles > 5) {
      toast.error("Chỉ được chọn tối đa 5 ảnh");
      return;
    }

    // Tạo preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setReportPhotoFiles((prev) => [...prev, ...files]);
    setReportPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  // Xóa ảnh khỏi danh sách
  const handleRemoveReportPhoto = (index: number) => {
    URL.revokeObjectURL(reportPhotoPreviewUrls[index]); // Clean up
    setReportPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setReportPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset report modal state
  const resetReportModal = () => {
    setShowReportModal(null);
    setReportGroupAssignments([]);
    setReportData({
      reportType: REPORT_TYPE.DAILY_PROGRESS,
      progressPercent: 50,
      description: "",
      blockedReason: "",
      status: REPORT_STATUS.IN_PROGRESS,
    });
    // Clean up preview URLs
    reportPhotoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setReportPhotoFiles([]);
    setReportPhotoPreviewUrls([]);
  };

  // Submit report - mặc định báo cáo cho tất cả người trong nhóm
  const handleSubmitReport = async () => {
    if (!showReportModal || !reportData.description.trim()) {
      toast.error("Vui lòng nhập ghi chú");
      return;
    }

    // Xác định danh sách assignments cần xử lý (tất cả trong nhóm, không lọc status)
    const assignmentsToProcess =
      reportGroupAssignments.length > 0
        ? reportGroupAssignments
        : [showReportModal];

    setActionLoading(showReportModal.id);
    try {
      // Upload ảnh nếu có
      let attachments: string[] | undefined;
      if (reportPhotoFiles.length > 0) {
        setUploadingPhotos(true);
        try {
          const results = await filesApi.uploadMultiple(reportPhotoFiles);
          attachments = results.map((r) => r.path).filter(Boolean);
        } finally {
          setUploadingPhotos(false);
        }
      }

      // Nếu báo cáo hoàn thành → gọi API complete cho tất cả assignments
      if (reportData.status === REPORT_STATUS.COMPLETED) {
        let lastResult: any = null;
        let completedCount = 0;
        for (const assignment of assignmentsToProcess) {
          // Chỉ complete những assignment có thể complete (pending hoặc in_progress)
          if (
            assignment.status === ASSIGNMENT_STATUS.PENDING ||
            assignment.status === ASSIGNMENT_STATUS.IN_PROGRESS
          ) {
            lastResult = await misaDataSourceApi.completeAssignment(
              assignment.id,
              {
                completionNotes: reportData.description,
                attachments,
              },
            );
            completedCount++;
          }
        }

        toast.success(
          completedCount > 1
            ? `Đã hoàn thành ${completedCount} công việc`
            : "Đã hoàn thành công việc",
        );
        resetReportModal();
        onRefreshAssignments(lastResult?.assignments);
        loadOrderReports(); // Refresh reports
        return;
      }

      // Nếu báo cáo chưa hoàn thành → gọi API mark incomplete cho tất cả
      if (reportData.status === REPORT_STATUS.INCOMPLETE) {
        let lastResult: any = null;
        let incompleteCount = 0;
        for (const assignment of assignmentsToProcess) {
          if (
            assignment.status === ASSIGNMENT_STATUS.PENDING ||
            assignment.status === ASSIGNMENT_STATUS.IN_PROGRESS
          ) {
            lastResult = await misaDataSourceApi.markAssignmentIncomplete(
              assignment.id,
              {
                incompleteReason: reportData.description,
                attachments,
              },
            );
            incompleteCount++;
          }
        }

        toast.success(
          incompleteCount > 1
            ? `Đã báo cáo chưa hoàn thành cho ${incompleteCount} công việc`
            : "Đã báo cáo chưa hoàn thành",
        );
        resetReportModal();
        onRefreshAssignments(lastResult?.assignments);
        loadOrderReports(); // Refresh reports
        return;
      }

      // Báo cáo tiến độ thông thường - tạo report cho tất cả assignments trong nhóm
      const calculatedStatus = getStatusFromProgress(
        reportData.progressPercent,
        reportData.reportType,
      );
      for (const assignment of assignmentsToProcess) {
        await misaDataSourceApi.createDailyReport(assignment.id, {
          reportType: reportData.reportType,
          status: calculatedStatus,
          progressPercent: reportData.progressPercent,
          description: reportData.description,
          blockedReason: reportData.blockedReason || undefined,
          attachments,
        });
      }
      toast.success(
        assignmentsToProcess.length > 1
          ? `Đã gửi báo cáo cho ${assignmentsToProcess.length} người`
          : "Đã gửi báo cáo",
      );
      resetReportModal();
      onRefreshAssignments();
      loadOrderReports(); // Refresh reports
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = ASSIGNMENT_STATUS_LABELS[status];
    if (!config) return <span className="text-gray-500">{status}</span>;
    const colorClasses: Record<string, string> = {
      gray: "bg-gray-100 text-gray-700",
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      orange: "bg-orange-100 text-orange-700",
      purple: "bg-purple-100 text-purple-700",
      red: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          colorClasses[config.color]
        }`}
      >
        {config.label}
      </span>
    );
  };

  // Lấy ID nhân viên hiện tại
  const getCurrentEmployeeId = (): number | null => {
    try {
      const employeeInfo = JSON.parse(
        localStorage.getItem("employee_info") || "null",
      );
      return employeeInfo?.id || null;
    } catch {
      return null;
    }
  };

  // Check if current user is assigned to this task
  const isAssignedToMe = (assignment: MisaSaOrderAssignment) => {
    const myId = getCurrentEmployeeId();
    return myId !== null && myId === assignment.assignedToId;
  };

  // Kiểm tra xem user có thuộc nhóm này không (có assignment nào trong nhóm)
  const isInGroup = (groupAssignments: MisaSaOrderAssignment[]) => {
    const myId = getCurrentEmployeeId();
    return (
      myId !== null && groupAssignments.some((a) => a.assignedToId === myId)
    );
  };

  // Check if assignment can be acted upon by current user
  const canAct = (assignment: MisaSaOrderAssignment) => {
    return isAssignedToMe(assignment) || canAssign;
  };

  // Check if user can act for the entire group (is member or has permission)
  const canActForGroup = (groupAssignments: MisaSaOrderAssignment[]) => {
    return isInGroup(groupAssignments) || canAssign;
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Giao việc
        </h3>
        <div className="flex items-center gap-2">
          {/* Nút bắt đầu lại khi có assignment bị blocked */}
          {canResume &&
            assignments.some((a) => a.status === ASSIGNMENT_STATUS.BLOCKED) && (
              <button
                onClick={() => setShowResumeConfirmModal(true)}
                disabled={actionLoading === -2}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === -2 ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Bắt đầu lại
              </button>
            )}
          {canAssign && availableTaskTypes.length > 0 && (
            <button
              onClick={() => {
                setSelectedTaskType(availableTaskTypes[0] || "");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Giao việc
            </button>
          )}
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Chưa có công việc nào được giao</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedAssignments).map(
            ([taskType, groupAssignments]) => {
              const groupStatus = getGroupStatus(groupAssignments);
              const isExpanded = expandedGroup === taskType;
              // Có thể báo cáo cho nhóm nếu: là thành viên nhóm hoặc có quyền, VÀ nhóm chưa có ai hoàn thành
              const hasAnyCompleted = groupAssignments.some(
                (a) => a.status === ASSIGNMENT_STATUS.COMPLETED,
              );
              const canReportForGroup =
                canActForGroup(groupAssignments) && !hasAnyCompleted;

              // Mở modal báo cáo cho cả nhóm
              const openGroupReport = () => {
                setShowReportModal(groupAssignments[0]); // Lấy assignment đầu tiên làm đại diện
                setReportGroupAssignments(groupAssignments); // Báo cáo cho tất cả
              };

              return (
                <div
                  key={taskType}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Group header */}
                  <div
                    className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : taskType)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        {(() => {
                          // Đếm số lượt giao việc (không phải số assignment)
                          // Lần 1: assignments gốc (reassignedFromId = null)
                          // Lần 2, 3...: mỗi lần giao lại
                          const getAssignmentRound = (
                            assignment: MisaSaOrderAssignment,
                          ): number => {
                            if (!assignment.reassignedFromId) return 1;
                            const parent = groupAssignments.find(
                              (a) => a.id === assignment.reassignedFromId,
                            );
                            return parent ? getAssignmentRound(parent) + 1 : 1;
                          };
                          const maxRound = Math.max(
                            ...groupAssignments.map(getAssignmentRound),
                          );
                          const uniqueEmployees = new Set(
                            groupAssignments.map((a) => a.assignedToId),
                          ).size;

                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {TASK_TYPE_LABELS[taskType] || taskType}
                                </span>
                                {getStatusBadge(groupStatus)}
                                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                  {maxRound} Lần
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({uniqueEmployees} người)
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-0.5 truncate max-w-md">
                                {[
                                  ...new Set(
                                    groupAssignments.map(
                                      (a) => a.assignedToName || "N/A",
                                    ),
                                  ),
                                ].join(", ")}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Group action buttons */}
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Nút giao việc lại khi có assignment incomplete */}
                      {canAssign &&
                        groupAssignments.some(
                          (a) => a.status === ASSIGNMENT_STATUS.INCOMPLETE,
                        ) && (
                          <button
                            onClick={() =>
                              openRetryModal(taskType, groupAssignments)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
                          >
                            <Repeat className="w-3 h-3" />
                            Giao lại
                          </button>
                        )}
                      {/* Nút bắt đầu lại khi có assignment blocked (tạm dừng) - chỉ hiển thị cho người có quyền */}
                      {canResume &&
                        groupAssignments.some(
                          (a) => a.status === ASSIGNMENT_STATUS.BLOCKED,
                        ) && (
                          <button
                            onClick={() => {
                              const blockedAssignment = groupAssignments.find(
                                (a) => a.status === ASSIGNMENT_STATUS.BLOCKED,
                              );
                              if (blockedAssignment)
                                handleResume(blockedAssignment);
                            }}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            {actionLoading !== null ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            Bắt đầu lại
                          </button>
                        )}
                      {canReportForGroup && (
                        <button
                          onClick={openGroupReport}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Báo cáo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded content - danh sách nhân viên */}
                  {isExpanded && (
                    <div className="border-t bg-white">
                      {groupAssignments.map((assignment, idx) => {
                        // Tính lần giao (round) của assignment này
                        const getAssignmentRound = (
                          a: MisaSaOrderAssignment,
                        ): number => {
                          if (!a.reassignedFromId) return 1;
                          const parent = groupAssignments.find(
                            (p) => p.id === a.reassignedFromId,
                          );
                          return parent ? getAssignmentRound(parent) + 1 : 1;
                        };
                        const round = getAssignmentRound(assignment);
                        const maxRound = Math.max(
                          ...groupAssignments.map(getAssignmentRound),
                        );

                        return (
                          <div
                            key={assignment.id}
                            className={`p-3 ${idx > 0 ? "border-t" : ""} ${
                              assignment.status === ASSIGNMENT_STATUS.REASSIGNED
                                ? "bg-gray-50 opacity-70"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                                  {(assignment.assignedToName ||
                                    "N")[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {assignment.assignedToName || "N/A"}
                                    </span>
                                    {maxRound > 1 && (
                                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                        Lần {round}
                                      </span>
                                    )}
                                    {getStatusBadge(assignment.status)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Giao lúc:{" "}
                                    {formatDate(assignment.assignedAt)}
                                    {assignment.startedAt &&
                                      ` • Bắt đầu: ${formatDate(
                                        assignment.startedAt,
                                      )}`}
                                    {assignment.completedAt &&
                                      ` • Xong: ${formatDate(
                                        assignment.completedAt,
                                      )}`}
                                  </div>
                                  {assignment.incompleteReason && (
                                    <div
                                      className={`text-xs mt-0.5 ${
                                        assignment.status ===
                                        ASSIGNMENT_STATUS.BLOCKED
                                          ? "text-red-600"
                                          : "text-orange-600"
                                      }`}
                                    >
                                      {assignment.status ===
                                      ASSIGNMENT_STATUS.BLOCKED
                                        ? "Lý do tạm dừng:"
                                        : "Lý do:"}{" "}
                                      {assignment.incompleteReason}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Individual action buttons */}
                              <div className="flex items-center gap-1">
                                {assignment.status ===
                                  ASSIGNMENT_STATUS.PENDING &&
                                  canAct(assignment) && (
                                    <button
                                      onClick={() => handleStart(assignment)}
                                      disabled={actionLoading === assignment.id}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
                                    >
                                      <Play className="w-3 h-3" />
                                      Bắt đầu
                                    </button>
                                  )}
                                {assignment.status ===
                                  ASSIGNMENT_STATUS.IN_PROGRESS &&
                                  canAct(assignment) && (
                                    <button
                                      onClick={() => {
                                        setShowReportModal(assignment);
                                        setReportGroupAssignments([]); // Báo cáo cá nhân, không phải nhóm
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      Báo cáo
                                    </button>
                                  )}
                                {assignment.status ===
                                  ASSIGNMENT_STATUS.INCOMPLETE &&
                                  canAssign && (
                                    <button
                                      onClick={() =>
                                        openRetryModal(assignment.taskType, [
                                          assignment,
                                        ])
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
                                    >
                                      <Repeat className="w-3 h-3" />
                                      Giao lại
                                    </button>
                                  )}
                                {canResume &&
                                  assignment.status ===
                                    ASSIGNMENT_STATUS.BLOCKED && (
                                    <button
                                      onClick={() => handleResume(assignment)}
                                      disabled={actionLoading === assignment.id}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50"
                                    >
                                      {actionLoading === assignment.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Play className="w-3 h-3" />
                                      )}
                                      Bắt đầu lại
                                    </button>
                                  )}
                                {(assignment.status ===
                                  ASSIGNMENT_STATUS.PENDING ||
                                  assignment.status ===
                                    ASSIGNMENT_STATUS.IN_PROGRESS) &&
                                  canAssign && (
                                    <>
                                      <button
                                        onClick={() =>
                                          setShowReassignModal(assignment)
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                        title="Chuyển giao"
                                      >
                                        <Repeat className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setShowDeleteModal(assignment)
                                        }
                                        disabled={
                                          actionLoading === assignment.id
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50"
                                        title="Xóa"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                              </div>
                            </div>

                            {/* Notes */}
                            {assignment.notes && (
                              <div className="mt-2 text-sm text-gray-600 pl-11">
                                <span className="text-gray-400">Ghi chú:</span>{" "}
                                {assignment.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Reports section */}
                      <div className="p-3 border-t bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Báo cáo tiến độ
                        </h4>
                        {loadingReports ? (
                          <div className="text-center py-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                          </div>
                        ) : reports.filter((r) =>
                            groupAssignments.some(
                              (a) => a.id === r.assignmentId,
                            ),
                          ).length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Chưa có báo cáo
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {reports
                              .filter((r) =>
                                groupAssignments.some(
                                  (a) => a.id === r.assignmentId,
                                ),
                              )
                              .map((report) => (
                                <div
                                  key={report.id}
                                  className="text-sm p-2 bg-white rounded border"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-700">
                                      {report.reportedByName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(report.reportedAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded ${
                                        report.status ===
                                        REPORT_STATUS.COMPLETED
                                          ? "bg-green-100 text-green-700"
                                          : report.status ===
                                              REPORT_STATUS.BLOCKED
                                            ? "bg-red-100 text-red-700"
                                            : report.status ===
                                                REPORT_STATUS.INCOMPLETE
                                              ? "bg-orange-100 text-orange-700"
                                              : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {REPORT_STATUS_LABELS[report.status] ||
                                        report.status}
                                    </span>
                                    {report.progressPercent !== null && (
                                      <span className="text-xs text-gray-500">
                                        {report.progressPercent}%
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600">
                                    {report.description}
                                  </p>
                                  {/* Hiển thị ảnh đính kèm */}
                                  {report.attachments &&
                                    report.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {report.attachments.map((url, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() =>
                                              openLightbox(
                                                report.attachments!,
                                                idx,
                                              )
                                            }
                                            className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                          >
                                            <img
                                              src={url}
                                              alt={`Ảnh ${idx + 1}`}
                                              className="w-16 h-16 object-cover rounded border hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                          </button>
                                        ))}
                                        {report.attachments.length > 1 && (
                                          <span className="text-xs text-gray-400 self-end">
                                            {report.attachments.length} ảnh
                                          </span>
                                        )}
                                      </div>
                                    )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && availableTaskTypes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Giao việc mới</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEmployeeSearch("");
                  setShowEmployeeDropdown(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Chọn loại công việc */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại công việc *
                </label>
                {availableTaskTypes.length === 1 ? (
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-medium">
                    {TASK_TYPE_LABELS[availableTaskTypes[0]] ||
                      availableTaskTypes[0]}
                  </div>
                ) : (
                  <select
                    value={selectedTaskType}
                    onChange={(e) => setSelectedTaskType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {availableTaskTypes.map((type) => (
                      <option key={type} value={type}>
                        {TASK_TYPE_LABELS[type] || type}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Multi-select dropdown với tìm kiếm */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên thực hiện *{" "}
                  {createData.assignedToIds.length > 0 && (
                    <span className="text-indigo-600">
                      ({createData.assignedToIds.length} đã chọn)
                    </span>
                  )}
                </label>

                {/* Hiển thị nhân viên đã chọn */}
                {createData.assignedToIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {createData.assignedToIds.map((id) => {
                      const emp = employees.find((e) => e.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                        >
                          {emp?.user?.fullName || "N/A"}
                          <button
                            type="button"
                            onClick={() => toggleEmployee(id)}
                            className="hover:text-indigo-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Input tìm kiếm */}
                <div className="relative">
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="Tìm kiếm nhân viên..."
                    className="w-full border rounded-lg px-3 py-2 pr-8"
                    disabled={loadingEmployees}
                  />
                  {loadingEmployees && (
                    <RefreshCw className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>

                {/* Dropdown danh sách nhân viên */}
                {showEmployeeDropdown && !loadingEmployees && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        {employeeSearch
                          ? "Không tìm thấy nhân viên"
                          : "Không có nhân viên"}
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isSelected = createData.assignedToIds.includes(
                          emp.id,
                        );
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleEmployee(emp.id)}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-50 ${
                              isSelected ? "bg-indigo-50" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {emp.user?.fullName || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {emp.user?.email || emp.user?.phone || ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Overlay để đóng dropdown khi click ra ngoài */}
                {showEmployeeDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowEmployeeDropdown(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={createData.notes}
                  onChange={(e) =>
                    setCreateData({ ...createData, notes: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEmployeeSearch("");
                  setShowEmployeeDropdown(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  creating ||
                  createData.assignedToIds.length === 0 ||
                  !selectedTaskType
                }
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  `Giao việc (${createData.assignedToIds.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Báo cáo tiến độ</h3>
                {reportGroupAssignments.length > 1 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Áp dụng cho {reportGroupAssignments.length} người:{" "}
                    {reportGroupAssignments
                      .map((a) => a.assignedToName)
                      .join(", ")}
                  </p>
                )}
              </div>
              <button
                onClick={resetReportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại báo cáo
                </label>
                <select
                  value={reportData.reportType}
                  onChange={(e) =>
                    setReportData({ ...reportData, reportType: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value={REPORT_TYPE.DAILY_PROGRESS}>
                    {REPORT_TYPE_LABELS[REPORT_TYPE.DAILY_PROGRESS]}
                  </option>
                  <option value={REPORT_TYPE.ISSUE}>
                    {REPORT_TYPE_LABELS[REPORT_TYPE.ISSUE]}
                  </option>
                </select>
              </div>
              {reportData.reportType === REPORT_TYPE.DAILY_PROGRESS && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiến độ (%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={reportData.progressPercent}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        progressPercent: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">
                      {reportData.progressPercent}%
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        reportData.progressPercent >= 100
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {reportData.progressPercent >= 100
                        ? "Hoàn thành"
                        : "Đang thực hiện"}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {reportData.reportType === REPORT_TYPE.ISSUE
                    ? "Mô tả sự cố *"
                    : "Ghi chú *"}
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder={
                    reportData.reportType === REPORT_TYPE.ISSUE
                      ? "Mô tả sự cố gặp phải..."
                      : "Mô tả tiến độ công việc..."
                  }
                />
              </div>
              {reportData.reportType === REPORT_TYPE.ISSUE && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do bị chặn
                  </label>
                  <textarea
                    value={reportData.blockedReason}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        blockedReason: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Nhập lý do không thể tiếp tục..."
                  />
                </div>
              )}

              {/* Upload ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh đính kèm{" "}
                  {reportPhotoFiles.length > 0 &&
                    `(${reportPhotoFiles.length}/5)`}
                </label>

                {/* Preview ảnh đã chọn */}
                {reportPhotoPreviewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {reportPhotoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveReportPhoto(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nút chọn ảnh */}
                {reportPhotoFiles.length < 5 && (
                  <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Image className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Thêm ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleReportPhotoSelect}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={resetReportModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={
                  actionLoading === showReportModal.id ||
                  uploadingPhotos ||
                  !reportData.description.trim()
                }
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === showReportModal.id || uploadingPhotos ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Gửi báo cáo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chuyển giao công việc</h3>
              <button
                onClick={() => setShowReassignModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên mới *
                </label>
                <select
                  value={reassignData.newAssignedToId}
                  onChange={(e) =>
                    setReassignData({
                      ...reassignData,
                      newAssignedToId: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={loadingEmployees}
                >
                  <option value={0}>-- Chọn nhân viên --</option>
                  {employees
                    .filter((e) => e.id !== showReassignModal.assignedToId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.fullName || "N/A"}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do chuyển
                </label>
                <textarea
                  value={reassignData.reassignReason}
                  onChange={(e) =>
                    setReassignData({
                      ...reassignData,
                      reassignReason: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Nhập lý do..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={reassignData.notes}
                  onChange={(e) =>
                    setReassignData({ ...reassignData, notes: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowReassignModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleReassign}
                disabled={
                  actionLoading === showReassignModal.id ||
                  !reassignData.newAssignedToId
                }
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading === showReassignModal.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Chuyển giao"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retry Modal - Giao lại việc cho nhân viên incomplete */}
      {showRetryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Giao việc lại</h3>
                <p className="text-sm text-gray-500">
                  {TASK_TYPE_LABELS[showRetryModal.taskType] ||
                    showRetryModal.taskType}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRetryModal(null);
                  setRetrySelectedIds([]);
                  setRetryNotes("");
                  setRetryNewEmployeeIds([]);
                  setRetryEmployeeSearch("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Chọn nhân viên để giao lại ({retrySelectedIds.length}/
                    {showRetryModal.allAssignments.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRetrySelectedIds(
                          showRetryModal.allAssignments.map((a) => a.id),
                        )
                      }
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setRetrySelectedIds([])}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                  {showRetryModal.allAssignments.map((assignment) => (
                    <label
                      key={assignment.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={retrySelectedIds.includes(assignment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRetrySelectedIds([
                              ...retrySelectedIds,
                              assignment.id,
                            ]);
                          } else {
                            setRetrySelectedIds(
                              retrySelectedIds.filter(
                                (id) => id !== assignment.id,
                              ),
                            );
                          }
                        }}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {assignment.assignedToName || "N/A"}
                          </span>
                          {getStatusBadge(assignment.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Giao: {formatDate(assignment.assignedAt)}
                          {assignment.startedAt &&
                            ` • Bắt đầu: ${formatDate(assignment.startedAt)}`}
                          {assignment.completedAt &&
                            ` • Xong: ${formatDate(assignment.completedAt)}`}
                        </div>
                        {assignment.incompleteReason && (
                          <div className="text-xs text-orange-600 mt-1">
                            Lý do chưa xong: {assignment.incompleteReason}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Thêm nhân viên mới */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thêm nhân viên mới{" "}
                  {retryNewEmployeeIds.length > 0 && (
                    <span className="text-green-600">
                      ({retryNewEmployeeIds.length} đã chọn)
                    </span>
                  )}
                </label>

                {/* Hiển thị nhân viên mới đã chọn */}
                {retryNewEmployeeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {retryNewEmployeeIds.map((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      return (
                        <span
                          key={empId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                        >
                          {emp?.user?.fullName || "N/A"}
                          <button
                            type="button"
                            onClick={() =>
                              setRetryNewEmployeeIds((prev) =>
                                prev.filter((id) => id !== empId),
                              )
                            }
                            className="hover:text-green-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Input tìm kiếm nhân viên */}
                <div className="relative">
                  <input
                    type="text"
                    value={retryEmployeeSearch}
                    onChange={(e) => setRetryEmployeeSearch(e.target.value)}
                    onFocus={() => setShowRetryEmployeeDropdown(true)}
                    placeholder="Tìm kiếm nhân viên..."
                    className="w-full border rounded-lg px-3 py-2 pr-8"
                    disabled={loadingEmployees}
                  />
                  {loadingEmployees && (
                    <RefreshCw className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>

                {/* Dropdown danh sách nhân viên */}
                {showRetryEmployeeDropdown && !loadingEmployees && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {retryFilteredEmployees.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        {retryEmployeeSearch
                          ? "Không tìm thấy nhân viên"
                          : "Không có nhân viên khác"}
                      </div>
                    ) : (
                      retryFilteredEmployees.map((emp) => {
                        const isSelected = retryNewEmployeeIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleRetryNewEmployee(emp.id)}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-50 ${
                              isSelected ? "bg-green-50" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-green-600 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {emp.user?.fullName || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {emp.user?.email || emp.user?.phone || ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Overlay để đóng dropdown khi click ra ngoài */}
                {showRetryEmployeeDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowRetryEmployeeDropdown(false)}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={retryNotes}
                  onChange={(e) => setRetryNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Nhập ghi chú cho việc giao lại..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRetryModal(null);
                  setRetrySelectedIds([]);
                  setRetryNotes("");
                  setRetryNewEmployeeIds([]);
                  setRetryEmployeeSearch("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleRetryAssignments}
                disabled={
                  actionLoading === -1 ||
                  (retrySelectedIds.length === 0 &&
                    retryNewEmployeeIds.length === 0)
                }
                className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading === -1 ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  `Giao việc (${
                    retrySelectedIds.length + retryNewEmployeeIds.length
                  })`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Confirmation Modal */}
      {showResumeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận bắt đầu lại
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Bạn có chắc muốn bắt đầu lại tất cả công việc đang tạm dừng?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Công việc đang tạm dừng:
                </p>
                <ul className="space-y-1">
                  {assignments
                    .filter((a) => a.status === ASSIGNMENT_STATUS.BLOCKED)
                    .map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="font-medium">
                          {TASK_TYPE_LABELS[a.taskType] || a.taskType}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-gray-600">
                          {a.assignedToName}
                        </span>
                      </li>
                    ))}
                </ul>
                {assignments.filter(
                  (a) => a.status === ASSIGNMENT_STATUS.BLOCKED,
                )[0]?.incompleteReason && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Lý do tạm dừng:</p>
                    <p className="text-sm text-red-600">
                      {
                        assignments.filter(
                          (a) => a.status === ASSIGNMENT_STATUS.BLOCKED,
                        )[0]?.incompleteReason
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowResumeConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleResumeAllBlocked}
                disabled={actionLoading === -2}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === -2 ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Bắt đầu lại
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa giao việc"
        description={
          showDeleteModal
            ? `Bạn có chắc muốn xóa giao việc "${
                TASK_TYPE_LABELS[showDeleteModal.taskType] ||
                showDeleteModal.taskType
              }" cho ${showDeleteModal.assignedToName || "nhân viên này"}?`
            : ""
        }
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />

      {/* Image Lightbox Modal */}
      {lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 text-sm text-white/80 bg-black/50 rounded-full">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronUp className="w-6 h-6 -rotate-90" />
            </button>
          )}

          {/* Main image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Ảnh ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronDown className="w-6 h-6 -rotate-90" />
            </button>
          )}

          {/* Thumbnail strip */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
              {lightboxImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex
                      ? "border-white ring-2 ring-blue-500"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          <div className="absolute bottom-4 right-4 text-xs text-white/50">
            ← → để chuyển ảnh • ESC để đóng
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to check permissions from localStorage
function checkPermission(permission: string): boolean {
  try {
    const permissions = JSON.parse(
      localStorage.getItem("employee_permissions") || "[]",
    );
    return permissions.includes(permission);
  } catch {
    return false;
  }
}

export default function MisaSalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [order, setOrder] = useState<MisaSaOrder | null>(null);
  const [details, setDetails] = useState<MisaSaOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Assignments
  const [assignments, setAssignments] = useState<MisaSaOrderAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Edit mode state (for non-draft orders)
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<MisaSaOrderLocalFieldsUpdate>(
    {},
  );
  const [saving, setSaving] = useState(false);

  // Check if user can assign tasks - tạm thời cho phép tất cả
  const canAssignTasks = true;

  // Check if user can resume blocked tasks - tạm thời cho phép tất cả (như canAssignTasks)
  // TODO: Bật lại permission check khi hệ thống permission được cấu hình đúng
  const canResumeTasks = true;
  // const canResumeTasks =
  //   checkPermission("approve_order") ||
  //   checkPermission("manager") ||
  //   checkPermission("assign_order_to_warehouse") ||
  //   checkPermission("assign_order_to_technical") ||
  //   checkPermission("submit_order_for_approval");

  // Check if order requires explicit edit mode (non-draft orders)
  const requiresExplicitEdit = (o: MisaSaOrder) => {
    return o.orderWorkflowStatus && o.orderWorkflowStatus !== "draft";
  };

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    if (!id) return;
    setLoadingAssignments(true);
    try {
      const data = await misaDataSourceApi.getOrderAssignments(Number(id));
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  }, [id]);

  // Refresh order only (without loading indicator) - for after assignment actions
  const refreshOrder = useCallback(async () => {
    if (!id) return;
    try {
      const result = await misaDataSourceApi.getSaOrderWithDetails(Number(id));
      setOrder(result.order);
    } catch (error) {
      console.error("Error refreshing order:", error);
    }
  }, [id]);

  // Handler for refreshing assignments - accepts direct update or refetches
  // Also refreshes order to get updated workflow status
  const handleRefreshAssignments = useCallback(
    (newAssignments?: MisaSaOrderAssignment[]) => {
      if (newAssignments) {
        setAssignments(newAssignments);
      } else {
        fetchAssignments();
      }
      // Always refresh order to get updated orderWorkflowStatus
      refreshOrder();
    },
    [fetchAssignments, refreshOrder],
  );

  // Start edit mode
  const startEdit = () => {
    if (!order) return;
    setEditMode(true);
    setEditValues({
      requestedDeliveryDate: order.requestedDeliveryDate || null,
      actualExportDate: order.actualExportDate || null,
      region: order.region || null,
      priority: order.priority || null,
      machineType: order.machineType || null,
      saleType: order.saleType || null,
      localDeliveryStatus: order.localDeliveryStatus || null,
      receiverName: order.receiverName || null,
      receiverPhone: order.receiverPhone || null,
      goodsStatus: order.goodsStatus || null,
      province: order.province || null,
      backDate: order.backDate || null,
    });
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditMode(false);
    setEditValues({});
  };

  // Save changes
  const saveEdit = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await misaDataSourceApi.updateSaOrderLocalFields(
        order.id,
        editValues,
      );
      setOrder(updated);
      setEditMode(false);
      setEditValues({});
      toast.success("Đã lưu thay đổi");
    } catch (error: any) {
      console.error("Error saving order:", error);
      toast.error(error.message || "Lỗi khi lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  // Get workflow status badge with task status
  const getWorkflowStatusBadge = (status: string) => {
    const statusConfig =
      ORDER_WORKFLOW_STATUS[status as keyof typeof ORDER_WORKFLOW_STATUS];
    if (!statusConfig)
      return <span className="text-gray-400 text-sm">{status}</span>;

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

    // Tính trạng thái task từ assignments (chỉ lấy active assignments - không phải reassigned/cancelled)
    const activeAssignments = assignments.filter(
      (a) =>
        a.status !== ASSIGNMENT_STATUS.REASSIGNED &&
        a.status !== ASSIGNMENT_STATUS.CANCELLED,
    );

    // Xác định trạng thái task chung
    let taskStatus: string | null = null;
    let taskStatusConfig: { label: string; color: string } | null = null;

    if (activeAssignments.length > 0) {
      if (
        activeAssignments.some((a) => a.status === ASSIGNMENT_STATUS.BLOCKED)
      ) {
        taskStatus = ASSIGNMENT_STATUS.BLOCKED;
        taskStatusConfig = ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.BLOCKED];
      } else if (
        activeAssignments.some((a) => a.status === ASSIGNMENT_STATUS.INCOMPLETE)
      ) {
        taskStatus = ASSIGNMENT_STATUS.INCOMPLETE;
        taskStatusConfig =
          ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.INCOMPLETE];
      } else if (
        activeAssignments.every((a) => a.status === ASSIGNMENT_STATUS.COMPLETED)
      ) {
        taskStatus = ASSIGNMENT_STATUS.COMPLETED;
        taskStatusConfig =
          ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.COMPLETED];
      } else if (
        activeAssignments.some(
          (a) => a.status === ASSIGNMENT_STATUS.IN_PROGRESS,
        )
      ) {
        taskStatus = ASSIGNMENT_STATUS.IN_PROGRESS;
        taskStatusConfig =
          ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.IN_PROGRESS];
      } else if (
        activeAssignments.some((a) => a.status === ASSIGNMENT_STATUS.PENDING)
      ) {
        taskStatus = ASSIGNMENT_STATUS.PENDING;
        taskStatusConfig = ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.PENDING];
      }
    }

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Workflow status badge */}
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            colorClasses[statusConfig.color]
          }`}
        >
          {statusConfig.label}
        </span>

        {/* Task status badge */}
        {taskStatusConfig && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              colorClasses[taskStatusConfig.color]
            }`}
            title="Trạng thái công việc"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
            {taskStatusConfig.label}
          </span>
        )}
      </div>
    );
  };

  // Handle submit for approval
  const handleSubmitForApproval = async () => {
    if (!order || submitting) return;

    setSubmitting(true);
    try {
      const result = await misaDataSourceApi.submitOrderForApproval(
        order.id,
        order.needsAdditionalOrder,
        order.additionalOrderNote || undefined,
      );
      if (result.success && result.order) {
        setOrder({ ...order, ...result.order });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch order with details
  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await misaDataSourceApi.getSaOrderWithDetails(Number(id));
      setOrder(result.order);
      setDetails(result.details);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchAssignments();
  }, [id, fetchAssignments]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Không tìm thấy đơn hàng
        </h2>
        <button
          onClick={() => navigate("/quan-ly/don-hang-misa")}
          className="text-blue-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/quan-ly/don-hang-misa")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Đơn hàng #{order.refNo}
              </h1>
              <p className="text-sm text-gray-500">
                Ngày tạo: {formatDate(order.misaCreatedDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getWorkflowStatusBadge(order.orderWorkflowStatus || "draft")}
            {(order.orderWorkflowStatus === "draft" ||
              !order.orderWorkflowStatus) && (
              <button
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Gửi BGĐ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Info - Hiển thị khi đã gửi duyệt */}
      {order.saleAdminName && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">Sale Admin phụ trách:</span>
              <span className="font-medium text-gray-900">
                {order.saleAdminName}
              </span>
            </div>
            {order.saleAdminSubmittedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Thời điểm gửi:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(order.saleAdminSubmittedAt)}
                </span>
              </div>
            )}
            {order.orderWorkflowStatus === "approved" && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">Đã duyệt</span>
              </div>
            )}
            {order.orderWorkflowStatus === "rejected" && (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-700">Đã từ chối</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sale Admin Info */}
      <div
        className={`rounded-lg shadow p-5 mb-6 ${
          order.priority === "Rất Gấp" || editValues.priority === "Rất Gấp"
            ? "bg-red-50 border-2 border-red-300"
            : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            Thông tin Sale Admin
          </h3>
          <div className="flex items-center gap-2">
            {(order.priority === "Rất Gấp" ||
              editValues.priority === "Rất Gấp") && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                <AlertTriangle className="w-4 h-4" />
                ĐƠN HÀNG RẤT GẤP!
              </span>
            )}
            {/* Edit/Save/Cancel buttons */}
            {!editMode && (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <Pencil className="w-4 h-4" />
                Sửa
              </button>
            )}
            {editMode && (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Lưu
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <Calendar className="w-4 h-4" />
                Ngày yêu cầu giao:
              </label>
              <input
                type="date"
                value={
                  editValues.requestedDeliveryDate
                    ? editValues.requestedDeliveryDate.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    requestedDeliveryDate: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <Truck className="w-4 h-4" />
                Ngày thực tế xuất kho:
              </label>
              <input
                type="date"
                value={
                  editValues.actualExportDate
                    ? editValues.actualExportDate.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    actualExportDate: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" />
                Khu vực:
              </label>
              <select
                value={editValues.region || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    region: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Chọn --</option>
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Độ ưu tiên:
              </label>
              <select
                value={editValues.priority || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    priority: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Chọn --</option>
                <option value="Bình thường">Bình thường</option>
                <option value="Gấp">Gấp</option>
                <option value="Rất Gấp">Rất Gấp</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <Package className="w-4 h-4" />
                Phân loại máy:
              </label>
              <select
                value={editValues.machineType || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    machineType: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Chọn --</option>
                <option value="Máy mới">Máy mới</option>
                <option value="Máy cũ">Máy cũ</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FileText className="w-4 h-4" />
                Loại:
              </label>
              <select
                value={editValues.saleType || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    saleType: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Chọn --</option>
                <option value="Bán">Bán</option>
                <option value="Cho thuê">Cho thuê</option>
                <option value="Cho mượn">Cho mượn</option>
                <option value="Trả hàng">Trả hàng</option>
              </select>
            </div>
            {editValues.saleType === "Cho mượn" ||
              (editValues.saleType === "Cho thuê" && (
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                    <Timer className="w-4 h-4" />
                    Số ngày cho mượn/thuê (nếu có):
                  </label>
                  <input
                    type="number"
                    value={editValues.backDate || 0}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        backDate: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Nhập số ngày"
                  />
                </div>
              ))}
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4" />
                Tình trạng giao hàng:
              </label>
              <select
                value={editValues.localDeliveryStatus || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    localDeliveryStatus: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Chọn --</option>
                <option value="Chưa giao">Chưa giao</option>
                <option value="Chưa giao hết">Chưa giao hết</option>
                <option value="Đã giao">Đã giao</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <User className="w-4 h-4" />
                Người nhận:
              </label>
              <input
                type="text"
                value={editValues.receiverName || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    receiverName: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Nhập tên người nhận"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <Phone className="w-4 h-4" />
                SĐT người nhận:
              </label>
              <input
                type="text"
                value={editValues.receiverPhone || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    receiverPhone: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Nhập SĐT"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" />
                Tỉnh/Thành phố:
              </label>
              <input
                type="text"
                value={editValues.province || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    province: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Nhập tỉnh/TP"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FileText className="w-4 h-4" />
                Tình trạng hàng hóa/Ghi chú:
              </label>
              <textarea
                value={editValues.goodsStatus || ""}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    goodsStatus: e.target.value || null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="Nhập ghi chú..."
              />
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Ngày yêu cầu giao:
                </span>
                <p className="font-medium">
                  {order.requestedDeliveryDate ? (
                    format(
                      new Date(order.requestedDeliveryDate),
                      "dd/MM/yyyy",
                      { locale: vi },
                    )
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Ngày thực tế xuất kho:
                </span>
                <p className="font-medium">
                  {order.actualExportDate ? (
                    format(new Date(order.actualExportDate), "dd/MM/yyyy", {
                      locale: vi,
                    })
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Khu vực:
                </span>
                <p className="font-medium mt-1">
                  {order.region ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                        order.region === "Miền Bắc"
                          ? "bg-sky-100 text-sky-700"
                          : order.region === "Miền Trung"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {order.region}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Độ ưu tiên:
                </span>
                <p className="font-medium mt-1">
                  {order.priority ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                        order.priority === "Rất Gấp"
                          ? "bg-red-100 text-red-700"
                          : order.priority === "Gấp"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.priority}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Phân loại máy:
                </span>
                <p className="font-medium mt-1">
                  {order.machineType ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                        order.machineType === "Máy mới"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.machineType}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Loại:
                </span>
                <p className="font-medium mt-1">
                  {order.saleType ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                        order.saleType === "Bán"
                          ? "bg-blue-100 text-blue-700"
                          : order.saleType === "Cho thuê"
                            ? "bg-purple-100 text-purple-700"
                            : order.saleType === "Cho mượn"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {order.saleType}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  Số ngày cho mượn/thuê (nếu có)
                </span>
                <p className="font-medium">
                  {order.backDate || (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Tình trạng giao hàng:
                </span>
                <p className="font-medium mt-1">
                  {order.localDeliveryStatus ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                        order.localDeliveryStatus === "Đã giao"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.localDeliveryStatus}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Người nhận:
                </span>
                <p className="font-medium">
                  {order.receiverName || (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  SĐT người nhận:
                </span>
                <p className="font-medium">
                  {order.receiverPhone || (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Tỉnh/Thành phố:
                </span>
                <p className="font-medium">
                  {order.province || (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </p>
              </div>
            </div>
            {order.goodsStatus && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Tình trạng hàng hóa/Ghi chú:
                </span>
                <p className="mt-1 text-gray-700">{order.goodsStatus}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Đặt thêm hàng - Section riêng, luôn cho phép edit */}
      <AdditionalOrderSection order={order} onUpdate={setOrder} />

      {/* Assignment Section - hiển thị khi đơn hàng đã được duyệt (từ waiting_export trở đi) */}
      {order.orderWorkflowStatus &&
        [
          "waiting_export",
          "in_preparation",
          "waiting_delivery",
          "in_delivery",
          "waiting_installation",
          "in_installation",
          "pending_completion",
          "completed",
        ].includes(order.orderWorkflowStatus) && (
          <AssignmentSection
            order={order}
            assignments={assignments}
            onRefreshAssignments={handleRefreshAssignments}
            canAssign={canAssignTasks}
            canResume={canResumeTasks}
          />
        )}

      {/* Order Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Thông tin khách hàng
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã KH:</span>
              <span className="font-medium">
                {order.accountObjectCode || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tên KH:</span>
              <span className="font-medium">
                {order.accountObjectName || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mã số thuế:</span>
              <span className="font-medium">
                {order.accountObjectTaxCode || "-"}
              </span>
            </div>
            {order.accountObjectAddress && (
              <div className="pt-2 border-t">
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Địa chỉ:
                </span>
                <p className="text-sm mt-1">{order.accountObjectAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Info */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Thông tin tài chính
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền hàng:</span>
              <span className="font-medium">
                {formatCurrency(order.totalSaleAmountOc)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chiết khấu:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(order.totalDiscountAmountOc)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thuế VAT:</span>
              <span className="font-medium">
                {formatCurrency(order.totalVatAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-700 font-medium">Tổng cộng:</span>
              <span className="font-bold text-lg text-blue-600">
                {formatCurrency(order.totalAmountOc)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Đã thu:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(order.totalReceiptedAmountOc)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Còn phải thu:</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(order.receivableAmountOc)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Thông tin bổ sung
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-500 text-sm">Chi nhánh:</span>
            <p className="font-medium">{order.branchName || "-"}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Người tạo:</span>
            <p className="font-medium">{order.createdBy || "-"}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Nhân viên phụ trách:</span>
            <p className="font-medium">{order.employeeName || "-"}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Đã xuất hóa đơn:</span>
            <p className="font-medium">{order.isInvoiced ? "Có" : "Chưa"}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Ngày sửa:</span>
            <p className="font-medium">{formatDate(order.misaModifiedDate)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Người sửa:</span>
            <p className="font-medium">{order.modifiedBy || "-"}</p>
          </div>
        </div>
        {order.journalMemo && (
          <div className="mt-4 pt-4 border-t">
            <span className="text-gray-500 text-sm">Diễn giải:</span>
            <p className="mt-1 text-gray-700">{order.journalMemo}</p>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Chi tiết đơn hàng ({details.length} sản phẩm)
          </h3>
        </div>

        {details.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Chưa có chi tiết sản phẩm
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã SP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kho
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    SL
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    VAT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {details.map((item, index) => (
                  <tr
                    key={item.id}
                    className={
                      item.isDescription
                        ? "bg-gray-50 italic"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {item.inventoryItemCode || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {item.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.stockCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.isDescription
                        ? "-"
                        : `${item.quantity} ${item.unitName || ""}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.isDescription
                        ? "-"
                        : formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.isDescription ? "-" : formatCurrency(item.amountOc)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                      {item.isDescription ? "-" : `${item.vatRate}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right font-medium">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">
                    {formatCurrency(
                      details.reduce(
                        (sum, item) => sum + (item.amountOc || 0),
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-600">
                    {formatCurrency(
                      details.reduce(
                        (sum, item) => sum + (item.vatAmountOc || 0),
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
