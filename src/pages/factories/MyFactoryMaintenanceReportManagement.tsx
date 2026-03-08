import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { maintenanceReportApi } from "../../api/maintenance-report";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import type {
  MaintenanceReport,
  MaintenanceReportStatus,
  MaintenanceReportPriority,
  Department,
} from "../../types";
import {
  Wrench,
  Eye,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Pagination from "../../components/commons/Pagination";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import MonthNavigation from "../../components/commons/MonthNavigation";
import StatisticsCards from "../../components/commons/StatisticsCards";
import MaintenanceReportDetailModal from "../../components/MaintenanceReportDetailModal";

export default function MyFactoryMaintenanceReportManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<MaintenanceReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<MaintenanceReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Auto-open detail modal from notification
  useEffect(() => {
    const detailId = searchParams.get('detailId');
    if (detailId && items.length > 0) {
      const item = items.find(i => String(i.id) === detailId);
      if (item) {
        setSelectedReport(item);
        setShowDetailModal(true);
        // Remove detailId from URL
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
            if (mounted) {
              setDepartments(depts);
            }
          } catch (error) {
            console.error("Failed to fetch departments:", error);
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      // Auto calculate from selected month/year
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch maintenance reports from server with filters
  useEffect(() => {
    (async () => {
      if (!factoryId || !startDate || !endDate) return;

      setLoading(true);
      try {
        const query: any = {
          page,
          limit,
          startDate,
          endDate,
        };

        // Add server-side filters
        if (statusFilter !== "all") query.status = statusFilter;
        if (priorityFilter !== "all") query.priority = priorityFilter;
        if (departmentFilter !== "all") query.departmentId = Number(departmentFilter);
        if (assignedToMe && employeeId) query.assignedEmployeeId = employeeId;

        const reportsRes = await maintenanceReportApi.getByFactory(factoryId, query);
        const data = (reportsRes as any).data?.data || reportsRes;
        setItems(Array.isArray(data) ? data : []);
        setTotal((reportsRes as any).data?.meta?.total || 0);
      } catch (error) {
        console.error("Failed to fetch maintenance reports:", error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId, page, limit, startDate, endDate, statusFilter, priorityFilter, departmentFilter, assignedToMe, employeeId]);

  // Client-side search filter only (other filters handled by server)
  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!searchTerm.trim()) return items;

    const search = searchTerm.toLowerCase();
    return items.filter((item) => {
      const machineName = item.machineName?.toLowerCase() || "";
      const machineCode = item.machineCode?.toLowerCase() || "";
      const employeeName = item.employee?.user?.fullName?.toLowerCase() || "";
      const issueDescription = item.issueDescription?.toLowerCase() || "";

      return (
        machineName.includes(search) ||
        machineCode.includes(search) ||
        employeeName.includes(search) ||
        issueDescription.includes(search)
      );
    });
  }, [items, searchTerm]);

  // Calculate statistics from filtered data
  const statistics = useMemo(() => {
    const stats = {
      total: filtered.length,
      byStatus: {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        cancelled: 0,
      },
      byPriority: {
        urgent: 0,
        high: 0,
      },
    };

    filtered.forEach((item) => {
      // Count by status
      if (item.status === 'pending') stats.byStatus.pending++;
      else if (item.status === 'in_progress') stats.byStatus.in_progress++;
      else if (item.status === 'resolved') stats.byStatus.resolved++;
      else if (item.status === 'cancelled') stats.byStatus.cancelled++;

      // Count urgent and high priority
      if (item.priority === 'urgent') stats.byPriority.urgent++;
      else if (item.priority === 'high') stats.byPriority.high++;
    });

    return stats;
  }, [filtered]);

  // Use filtered items for display (search is client-side)
  const displayItems = useMemo(() => {
    return filtered;
  }, [filtered]);

  // Reset page when server filters change (not search since it's client-side)
  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, departmentFilter, assignedToMe, selectedMonth, selectedYear, startDate, endDate, limit]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    // Clear custom date range when navigating months
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
    // Clear custom date range when navigating months
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
    // Clear custom date range when going to today
    setStartDate("");
    setEndDate("");

    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  // Handle view report detail
  const handleViewDetail = async (report: MaintenanceReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  // Get status badge classes
  const getStatusBadgeClass = (status: MaintenanceReportStatus) => {
    const config = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return config[status] || config.pending;
  };

  // Get status label
  const getStatusLabel = (status: MaintenanceReportStatus) => {
    const labels = {
      pending: "Chờ xử lý",
      in_progress: "Đang xử lý",
      resolved: "Đã hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  // Get priority badge classes
  const getPriorityBadgeClass = (priority: MaintenanceReportPriority) => {
    const config = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-blue-100 text-blue-600",
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };
    return config[priority] || config.medium;
  };

  // Get priority label
  const getPriorityLabel = (priority: MaintenanceReportPriority) => {
    const labels = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      urgent: "Khẩn cấp",
    };
    return labels[priority] || priority;
  };

  // Get actions for dropdown
  const getActions = (report: MaintenanceReport) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => handleViewDetail(report),
      },
    ];

    return actions;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Format datetime
  // const formatDateTime = (dateString: string) => {
  //   return new Date(dateString).toLocaleString("vi-VN");
  // };

  // Check if any filters are active (excluding month/year since it's default)
  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    departmentFilter !== "all" ||
    assignedToMe ||
    startDate !== "" ||
    endDate !== "" ||
    searchTerm.trim() !== "";

  if (loading && items.length === 0) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý báo cáo máy hỏng</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Theo dõi và quản lý các báo cáo máy móc gặp sự cố
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
                { value: "all", label: "Tất cả trạng thái" },
                { value: "pending", label: "Chờ xử lý" },
                { value: "in_progress", label: "Đang xử lý" },
                { value: "resolved", label: "Đã hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ],
            },
            {
              type: "select",
              label: "Mức độ",
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: "all", label: "Tất cả mức độ" },
                { value: "urgent", label: "Khẩn cấp" },
                { value: "high", label: "Cao" },
                { value: "medium", label: "Trung bình" },
                { value: "low", label: "Thấp" },
              ],
            },
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
            {
              type: "checkbox",
              label: "Chỉ báo cáo giao cho tôi",
              value: assignedToMe,
              onChange: setAssignedToMe,
              className: "flex items-center",
            },
          ]}
          gridCols="sm:grid-cols-3"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên máy, mã máy, nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            setDepartmentFilter("all");
            setAssignedToMe(false);
            setStartDate("");
            setEndDate("");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Statistics Cards */}
      <StatisticsCards
        cards={[
          {
            value: statistics.total,
            label: "Tổng báo cáo",
            icon: <Wrench className="h-5 w-5" />,
            bgColor: "blue",
          },
          {
            value: statistics.byStatus.pending,
            label: "Chờ xử lý",
            icon: <AlertCircle className="h-5 w-5" />,
            bgColor: "yellow",
          },
          {
            value: statistics.byStatus.in_progress,
            label: "Đang xử lý",
            icon: <Clock className="h-5 w-5" />,
            bgColor: "orange",
          },
          {
            value: statistics.byStatus.resolved,
            label: "Đã hoàn thành",
            icon: <CheckCircle2 className="h-5 w-5" />,
            bgColor: "green",
          },
          {
            value: statistics.byPriority.urgent + statistics.byPriority.high,
            label: "Ưu tiên cao",
            icon: <XCircle className="h-5 w-5" />,
            bgColor: "red",
          },
        ]}
        gridCols="md:grid-cols-5"
      />

      {/* Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">Danh sách Báo cáo</h2>
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
          {displayItems.map((report) => (
            <div key={report.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{report.machineName}</span>
                    {report.machineCode && (
                      <span className="text-xs text-gray-500">({report.machineCode})</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-500">Nhân viên:</span>{" "}
                      <strong>{report.employee?.user?.fullName || "-"}</strong>
                    </div>
                    {report.employee?.department && (
                      <div>
                        <span className="text-gray-500">Phòng ban:</span> {report.employee.department?.name || '-'}
                      </div>
                    )}
                    {report.assignedEmployee && (
                      <div>
                        <span className="text-gray-500">Người xử lý:</span> {report.assignedEmployee.user?.fullName || '-'}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Ngày báo:</span> {formatDate(report.reportDate)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(report.priority)}`}
                      >
                        {getPriorityLabel(report.priority)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <ActionsDropdown actions={getActions(report)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">
                  Máy móc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
                  Nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vấn đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                  Ngày báo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                  Mức độ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayItems.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-medium truncate max-w-[160px]" title={report.machineName}>
                      {report.machineName}
                    </div>
                    {report.machineCode && (
                      <div className="text-xs text-gray-500">{report.machineCode}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="truncate max-w-[120px]" title={report.employee?.user?.fullName || "-"}>
                      {report.employee?.user?.fullName || "-"}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]" title={report.employee?.department?.name || ""}>
                      {report.employee?.department?.name || ""}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="truncate max-w-[250px]" title={report.issueDescription}>
                      {report.issueDescription}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(report.reportDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(report.priority)}`}
                    >
                      {getPriorityLabel(report.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <ActionsDropdown actions={getActions(report)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!displayItems.length && !loading && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm.trim() ? "Không tìm thấy kết quả phù hợp" : `Không có báo cáo tháng ${selectedMonth + 1} năm ${selectedYear}`}
          </div>
        )}

        {loading && (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        )}

        <Pagination
          page={page}
          limit={limit}
          total={searchTerm.trim() ? filtered.length : total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Detail Modal */}
      <MaintenanceReportDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
      />
    </div>
  );
}
