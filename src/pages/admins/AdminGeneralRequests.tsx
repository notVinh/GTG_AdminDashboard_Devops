import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Trash2,
  Eye,
  Search,
} from "lucide-react";
import { generalRequestApi } from "../../api/generalRequest";
import type { GeneralRequest } from "../../types/general-request";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/commons/Pagination";
import MonthNavigation from "../../components/commons/MonthNavigation";
import FilterSection from "../../components/commons/FilterSection";
import CreateGeneralRequestModal from "../../components/CreateGeneralRequestModal";
import ConfirmModal from "../../components/ConfirmModal";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { employeeApi } from "../../api/employee";

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
};

export default function AdminGeneralRequests() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"my" | "assigned">("my");
  const [requests, setRequests] = useState<GeneralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | "delete" | null;
    request: GeneralRequest | null;
    note: string;
    error?: string;
  }>({
    isOpen: false,
    type: null,
    request: null,
    note: "",
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === "my") {
        res = await generalRequestApi.getMyRequests(page, limit);
      } else {
        res = await generalRequestApi.getAssignedToMe(page, limit);
      }

      // Nếu res.data chưa có tên, hãy fetch bổ sung ở đây
      const requestsWithNames = await Promise.all(
        res.data.map(async (req: any) => {
          if (req.approverEmployeeId && !req.approver?.name) {
            try {
              const empRes = await employeeApi.getEmployeeById(
                req.approverEmployeeId,
              );
              return {
                ...req,
                approver: { ...req.approver, name: empRes.user?.fullName },
              };
            } catch {
              return req;
            }
          }
          return req;
        }),
      );

      setRequests(requestsWithNames);
      setTotal(res.meta.total);
    } catch (error: any) {
      toast?.error(error.message || "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleTabChange = (tab: "my" | "assigned") => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleOpenConfirm = (
    type: "approve" | "reject" | "delete",
    request: GeneralRequest,
  ) => {
    setConfirmModal({
      isOpen: true,
      type,
      request,
      note: "",
    });
  };

  const handleConfirmAction = async () => {
    const { type, request, note } = confirmModal;
    if (!request || !type) return;

    if (type === "reject" && !note.trim()) {
      setConfirmModal((prev) => ({
        ...prev,
        error: "Vui lòng nhập lý do từ chối",
      }));
      return;
    }

    try {
      if (type === "delete") {
        await generalRequestApi.deleteRequest(request.id);
        toast?.success("Xóa yêu cầu thành công");
      } else {
        await generalRequestApi.reviewRequest(request.id, {
          status: type === "approve" ? "approved" : "rejected",
          decisionNote: note.trim() || undefined,
        });
        toast?.success(
          `${type === "approve" ? "Duyệt" : "Từ chối"} yêu cầu thành công`,
        );
      }
      setConfirmModal({ isOpen: false, type: null, request: null, note: "" });
      fetchRequests();
    } catch (error: any) {
      toast?.error(error.message || "Có lỗi xảy ra");
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Filter by status
      if (statusFilter && req.status !== statusFilter) return false;

      // Filter by search term
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        return (
          req.title.toLowerCase().includes(search) ||
          req.content.toLowerCase().includes(search) ||
          (req.requester?.name || "").toLowerCase().includes(search) ||
          (req.approver?.name || "").toLowerCase().includes(search)
        );
      }

      // Filter by month/year (Backend might do this, but if not we do it here)
      const reqDate = new Date(req.createdAt);
      if (
        reqDate.getMonth() !== selectedMonth ||
        reqDate.getFullYear() !== selectedYear
      )
        return false;

      return true;
    });
  }, [requests, statusFilter, searchTerm, selectedMonth, selectedYear]);

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP];
    if (!statusInfo) return null;
    const StatusIcon = statusInfo.icon;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
          statusInfo.color,
        )}
      >
        <StatusIcon className="w-3 h-3" />
        {statusInfo.label}
      </span>
    );
  };

  const getActions = (req: GeneralRequest) => {
    const actions: any[] = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="w-4 h-4" />,
        onClick: () => navigate(`/quan-ly/yeu-cau-chung/${req.id}`),
      },
    ];

    if (activeTab === "assigned" && req.status === "pending") {
      actions.push({
        label: "Duyệt",
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: () => handleOpenConfirm("approve", req),
      });
      actions.push({
        label: "Từ chối",
        icon: <XCircle className="w-4 h-4" />,
        variant: "danger",
        onClick: () => handleOpenConfirm("reject", req),
      });
    }

    if (activeTab === "my" && req.status === "pending") {
      actions.push({
        label: "Xóa",
        icon: <Trash2 className="w-4 h-4" />,
        variant: "danger",
        onClick: () => handleOpenConfirm("delete", req),
      });
    }

    return actions;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Yêu cầu chung
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý các yêu cầu văn phòng phẩm, bảo trì...
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Tạo yêu cầu
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-gray-200 px-4 pt-1">
          <button
            onClick={() => handleTabChange("my")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative cursor-pointer",
              activeTab === "my"
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Yêu cầu của tôi
          </button>
          <button
            onClick={() => handleTabChange("assigned")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative cursor-pointer",
              activeTab === "assigned"
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Cần xét duyệt
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/30">
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
                ],
                icon: <Clock className="h-4 w-4 text-gray-400" />,
              },
            ]}
            searchSlot={
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tiêu đề, nội dung, người gửi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                />
              </div>
            }
            onClearFilters={() => {
              setStatusFilter("");
              setSearchTerm("");
            }}
            hasActiveFilters={statusFilter !== "" || searchTerm !== ""}
          />
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800">
            Danh sách {activeTab === "my" ? "tôi đã gửi" : "chờ tôi duyệt"}
          </h2>
          <MonthNavigation
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrevMonth={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            onNextMonth={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
          />
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <Clock className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Không tìm thấy yêu cầu nào
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 space-y-3 active:bg-gray-50 transition-colors"
                onClick={() => navigate(`/quan-ly/yeu-cau-chung/${req.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-blue-700 text-lg leading-tight mb-1">
                    {req.title}
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {req.content}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                      {(activeTab === "my"
                        ? req.approver?.name
                        : req.requester?.name)?.[0] || "?"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activeTab === "my" ? "Duyệt bởi: " : "Gửi từ: "}
                      <span className="font-semibold text-gray-700">
                        {activeTab === "my"
                          ? req.approver?.name
                          : req.requester?.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {format(new Date(req.createdAt), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Tiêu đề & Nội dung</th>
                <th className="px-6 py-4">
                  {activeTab === "my" ? "Người duyệt" : "Người gửi"}
                </th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Clock className="w-8 h-8 animate-spin mx-auto text-blue-200 mb-2" />
                    <p className="text-sm text-gray-400">
                      Đang đồng bộ dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-gray-400 italic"
                  >
                    Không có bản ghi nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/quan-ly/yeu-cau-chung/${req.id}`)}
                  >
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {req.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {req.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-1 ring-blue-100 shadow-sm">
                          {(activeTab === "my"
                            ? req.approver?.name
                            : req.requester?.name)?.[0] || "?"}
                        </div> */}
                        <div className="text-sm font-medium text-gray-700">
                          {activeTab === "my"
                            ? req.approver?.name
                            : // : req.requester?.name || "N/A"}
                              req.employee?.user?.fullName || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {format(new Date(req.createdAt), "dd/MM/yyyy")}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                        {format(new Date(req.createdAt), "HH:mm")}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionsDropdown actions={getActions(req)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <Pagination
            page={page}
            limit={limit}
            total={
              filteredRequests.length > total ? filteredRequests.length : total
            }
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>

      <CreateGeneralRequestModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(msg) => {
          toast?.success(msg);
          fetchRequests();
        }}
        onError={(msg) => toast?.error(msg)}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === "approve"
            ? "Chấp nhận yêu cầu"
            : confirmModal.type === "reject"
              ? "Từ chối yêu cầu"
              : "Hủy bỏ yêu cầu"
        }
        description={
          confirmModal.type === "delete"
            ? `Dữ liệu về yêu cầu "${confirmModal.request?.title}" sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?`
            : `Hành động này sẽ cập nhật trạng thái yêu cầu sang "${confirmModal.type === "approve" ? "Đã duyệt" : "Từ chối"}".`
        }
        confirmText={
          confirmModal.type === "approve"
            ? "Đồng ý Duyệt"
            : confirmModal.type === "reject"
              ? "Xác nhận Từ chối"
              : "Xác nhận Xóa"
        }
        variant={confirmModal.type === "approve" ? "default" : "danger"}
        showInput={confirmModal.type !== "delete"}
        inputLabel={
          confirmModal.type === "reject"
            ? "Lý do từ chối (bắt buộc)"
            : "Ghi chú bổ sung"
        }
        inputPlaceholder={
          confirmModal.type === "reject"
            ? "Vui lòng nhập lý do để nhân viên nắm được thông tin..."
            : "Nhập ghi chú (nếu có)..."
        }
        inputValue={confirmModal.note}
        onInputChange={(val) =>
          setConfirmModal((prev) => ({ ...prev, note: val, error: undefined }))
        }
        inputError={confirmModal.error}
        inputRequired={confirmModal.type === "reject"}
      />
    </div>
  );
}
