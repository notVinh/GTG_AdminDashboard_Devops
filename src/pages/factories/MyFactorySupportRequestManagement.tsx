import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supportRequestApi, supportTypeApi } from "../../api/support-request";
import { useDebounce } from "../../hooks/useDebounce";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import type {
  SupportRequest,
  SupportRequestStatus,
  SupportType,
} from "../../types/support-request";
import type { Department } from "../../types";
import {
  HandCoins,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Plus,
  Check,
  X,
  Edit,
} from "lucide-react";
import Pagination from "../../components/commons/Pagination";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import MonthNavigation from "../../components/commons/MonthNavigation";
import StatisticsCards from "../../components/commons/StatisticsCards";
import ExportSupportRequestModal from "../../components/ExportSupportRequestModal";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

export default function MyFactorySupportRequestManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [supportTypes, setSupportTypes] = useState<SupportType[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Auto-open detail modal from notification
  useEffect(() => {
    const detailId = searchParams.get('detailId');
    if (detailId && items.length > 0) {
      const item = items.find(i => String(i.id) === detailId);
      if (item) {
        handleViewDetail(item);
        searchParams.delete('detailId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, items, setSearchParams]);

  // Get current employee info and departments
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted && me) {
          const currentFactoryId = Number((me as any).factoryId);
          const currentEmployeeId = Number((me as any).id);
          setFactoryId(currentFactoryId);
          setEmployeeId(currentEmployeeId);

          // Fetch departments
          try {
            const depts = await departmentApi.getAll(currentFactoryId);
            if (mounted) setDepartments(depts);
          } catch (error) {
            console.error("Failed to fetch departments:", error);
          }

          // Fetch support types
          try {
            const types = await supportTypeApi.getByFactory(currentFactoryId);
            if (mounted) setSupportTypes(types);
          } catch (error) {
            console.error("Failed to fetch support types:", error);
          }
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch support requests
  useEffect(() => {
    (async () => {
      if (!factoryId || !startDate || !endDate) return;

      setLoading(true);
      try {
        const query: any = { page, limit, startDate, endDate };
        if (statusFilter !== "all") query.status = statusFilter;
        if (departmentFilter !== "all") query.departmentId = Number(departmentFilter);
        if (debouncedSearchTerm.trim()) query.search = debouncedSearchTerm.trim();

        const res = await supportRequestApi.getByFactory(factoryId, query);
        setItems(res.data);
        setTotal(res.meta.total);
      } catch (error) {
        console.error("Failed to fetch support requests:", error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId, page, limit, startDate, endDate, statusFilter, departmentFilter, debouncedSearchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      total: items.length,
      byStatus: { pending: 0, approved: 0, rejected: 0, cancelled: 0 },
    };
    items.forEach((item) => {
      if (item.status in stats.byStatus) {
        stats.byStatus[item.status as keyof typeof stats.byStatus]++;
      }
    });
    return stats;
  }, [items]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, departmentFilter, selectedMonth, selectedYear, startDate, endDate, limit, debouncedSearchTerm]);

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

  const handleToday = () => {
    setStartDate("");
    setEndDate("");
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  // Handle view detail - navigate to edit page
  const handleViewDetail = (request: SupportRequest) => {
    navigate(`/nha-may-cua-toi/bao-ho-tro/tao?id=${request.id}`);
  };

  // Handle approve
  const handleApprove = async (request: SupportRequest) => {
    const confirmed = await confirm({
      title: "Xác nhận duyệt",
      message: `Bạn có chắc chắn muốn duyệt yêu cầu hỗ trợ của ${request.employee?.user?.fullName}?`,
      confirmText: "Duyệt",
      cancelText: "Hủy",
      type: "info",
    });

    if (confirmed) {
      try {
        await supportRequestApi.update(request.id, { status: "approved" });
        showToast("Đã duyệt yêu cầu hỗ trợ", "success");
        // Refresh data
        const res = await supportRequestApi.getByFactory(factoryId!, {
          page, limit, startDate, endDate,
          status: statusFilter !== "all" ? statusFilter as any : undefined,
          departmentId: departmentFilter !== "all" ? Number(departmentFilter) : undefined,
        });
        setItems(res.data);
        setTotal(res.meta.total);
      } catch (error) {
        console.error("Failed to approve:", error);
        showToast("Không thể duyệt yêu cầu", "error");
      }
    }
  };

  // Handle reject
  const handleReject = async (request: SupportRequest) => {
    const confirmed = await confirm({
      title: "Xác nhận từ chối",
      message: `Bạn có chắc chắn muốn từ chối yêu cầu hỗ trợ của ${request.employee?.user?.fullName}?`,
      confirmText: "Từ chối",
      cancelText: "Hủy",
      type: "danger",
    });

    if (confirmed) {
      try {
        await supportRequestApi.update(request.id, { status: "rejected" });
        showToast("Đã từ chối yêu cầu hỗ trợ", "success");
        // Refresh data
        const res = await supportRequestApi.getByFactory(factoryId!, {
          page, limit, startDate, endDate,
          status: statusFilter !== "all" ? statusFilter as any : undefined,
          departmentId: departmentFilter !== "all" ? Number(departmentFilter) : undefined,
        });
        setItems(res.data);
        setTotal(res.meta.total);
      } catch (error) {
        console.error("Failed to reject:", error);
        showToast("Không thể từ chối yêu cầu", "error");
      }
    }
  };

  // Get status badge
  const getStatusBadgeClass = (status: SupportRequestStatus) => {
    const config: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return config[status] || config.pending;
  };

  const getStatusLabel = (status: SupportRequestStatus) => {
    const labels: Record<string, string> = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  // Get actions for dropdown
  const getActions = (request: SupportRequest) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => handleViewDetail(request),
      },
    ];

    if (request.status === "pending") {
      actions.push(
        {
          label: "Sửa",
          icon: <Edit className="h-4 w-4" />,
          onClick: () => navigate(`/nha-may-cua-toi/bao-ho-tro/tao?id=${request.id}`),
        },
        {
          label: "Duyệt",
          icon: <Check className="h-4 w-4" />,
          onClick: () => handleApprove(request),
        },
        {
          label: "Từ chối",
          icon: <X className="h-4 w-4" />,
          onClick: () => handleReject(request),
        }
      );
    }

    return actions;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Format items summary
  const formatItemsSummary = (request: SupportRequest) => {
    if (!request.items || request.items.length === 0) return "-";
    return request.items.map(item => {
      const typeName = item.supportType?.name || "N/A";
      if (item.supportType?.requireQuantity && item.quantity > 1) {
        return `${typeName} (${item.quantity}${item.supportType.unit || ''})`;
      }
      return typeName;
    }).join(", ");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    searchTerm !== "";

  if (loading && items.length === 0) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <HandCoins className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý báo phí hỗ trợ</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Theo dõi và quản lý các yêu cầu hỗ trợ của nhân viên
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/nha-may-cua-toi/bao-ho-tro/tao-moi")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tạo mới
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={!factoryId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Bộ phận",
              value: departmentFilter,
              onChange: setDepartmentFilter,
              options: [
                { value: "all", label: "Tất cả bộ phận" },
                ...departments.map(dept => ({
                  value: dept.id.toString(),
                  label: dept.name,
                })),
              ],
            },
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Tất cả trạng thái" },
                { value: "pending", label: "Chờ duyệt" },
                { value: "approved", label: "Đã duyệt" },
                { value: "rejected", label: "Từ chối" },
                { value: "cancelled", label: "Đã hủy" },
              ],
            },
            {
              type: "date",
              label: "Từ ngày",
              value: startDate,
              onChange: setStartDate,
            },
            {
              type: "date",
              label: "Đến ngày",
              value: endDate,
              onChange: setEndDate,
            },
          ]}
          gridCols="sm:grid-cols-4"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên nhân viên, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("all");
            setDepartmentFilter("all");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Statistics */}
      <StatisticsCards
        cards={[
          {
            value: statistics.total,
            label: "Tổng yêu cầu",
            icon: <HandCoins className="h-5 w-5" />,
            bgColor: "blue",
          },
          {
            value: statistics.byStatus.pending,
            label: "Chờ duyệt",
            icon: <Clock className="h-5 w-5" />,
            bgColor: "yellow",
          },
          {
            value: statistics.byStatus.approved,
            label: "Đã duyệt",
            icon: <CheckCircle2 className="h-5 w-5" />,
            bgColor: "green",
          },
          {
            value: statistics.byStatus.rejected,
            label: "Từ chối",
            icon: <XCircle className="h-5 w-5" />,
            bgColor: "red",
          },
        ]}
        gridCols="md:grid-cols-4"
      />

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">Danh sách yêu cầu hỗ trợ</h2>
          <MonthNavigation
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {items.map((request) => (
            <div key={request.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {request.employee?.user?.fullName || "-"}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-500">Phòng ban:</span>{" "}
                      {request.employee?.department?.name || "-"}
                    </div>
                    <div>
                      <span className="text-gray-500">Ngày:</span>{" "}
                      {formatDate(request.requestDate)}
                    </div>
                    <div>
                      <span className="text-gray-500">Loại hỗ trợ:</span>{" "}
                      {formatItemsSummary(request)}
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <ActionsDropdown actions={getActions(request)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phòng ban
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại hỗ trợ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.employee?.user?.fullName || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.employee?.department?.name || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.requestDate)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{formatItemsSummary(request)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <ActionsDropdown actions={getActions(request)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!items.length && !loading && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? "Không tìm thấy kết quả phù hợp"
              : `Không có yêu cầu hỗ trợ tháng ${selectedMonth + 1} năm ${selectedYear}`}
          </div>
        )}

        {loading && (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        )}

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Export Modal */}
      {factoryId && (
        <ExportSupportRequestModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          factoryId={factoryId}
        />
      )}
    </div>
  );
}
