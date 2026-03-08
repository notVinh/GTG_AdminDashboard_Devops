import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { overnightReportApi } from "../../api/overnight-report";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import type {
  OvernightReport,
  OvernightReportStatus,
  Department,
} from "../../types";
import {
  Moon,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Download,
} from "lucide-react";
import Pagination from "../../components/commons/Pagination";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import OvernightReportDetailModal from "../../components/OvernightReportDetailModal";
import ExportOvernightReportModal from "../../components/ExportOvernightReportModal";
import MonthNavigation from "../../components/commons/MonthNavigation";
import StatisticsCards from "../../components/commons/StatisticsCards";

export default function MyFactoryOvernightReportManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<OvernightReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<OvernightReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

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
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch overnight reports from server with filters
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

        if (statusFilter !== "all") query.status = statusFilter;
        if (departmentFilter !== "all") query.departmentId = Number(departmentFilter);
        if (assignedToMe && employeeId) query.employeeId = employeeId;

        const reportsRes = await overnightReportApi.getByFactory(factoryId, query);
        setItems(reportsRes.data);
        setTotal(reportsRes.meta.total);
      } catch (error) {
        console.error("Failed to fetch overnight reports:", error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId, page, limit, startDate, endDate, statusFilter, departmentFilter, assignedToMe, employeeId]);

  // Client-side search filter only
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const search = searchTerm.toLowerCase();
    return items.filter((item) => {
      const address = item.address?.toLowerCase() || "";
      const employeeName = item.employee?.user?.fullName?.toLowerCase() || "";
      const note = item.note?.toLowerCase() || "";

      return (
        address.includes(search) ||
        employeeName.includes(search) ||
        note.includes(search)
      );
    });
  }, [items, searchTerm]);

  // Calculate statistics from filtered data
  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: filtered.length,
      byStatus: {
        reported: 0,
        confirmed: 0,
      },
      today: 0,
    };

    filtered.forEach((item) => {
      if (item.status === 'reported') stats.byStatus.reported++;
      else if (item.status === 'confirmed') stats.byStatus.confirmed++;

      const reportDate = new Date(item.reportDate);
      reportDate.setHours(0, 0, 0, 0);
      if (reportDate.getTime() === today.getTime()) {
        stats.today++;
      }
    });

    return stats;
  }, [filtered]);

  // Use filtered items for display
  const displayItems = useMemo(() => {
    return filtered;
  }, [filtered]);

  // Reset page when server filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, departmentFilter, assignedToMe, selectedMonth, selectedYear, startDate, endDate, limit]);

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

  // Handle view report detail
  const handleViewDetail = async (report: OvernightReport) => {
    try {
      // Fetch full detail with receivers
      const fullReport = await overnightReportApi.getById(report.id);
      setSelectedReport(fullReport);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to fetch report detail:", error);
      setSelectedReport(report);
      setShowDetailModal(true);
    }
  };

  // Get status badge classes
  const getStatusBadgeClass = (status: OvernightReportStatus) => {
    const config = {
      reported: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
    };
    return config[status] || config.reported;
  };

  // Get status label
  const getStatusLabel = (status: OvernightReportStatus) => {
    const labels = {
      reported: "Đã báo cáo",
      confirmed: "Đã xác nhận",
    };
    return labels[status] || status;
  };

  // Get actions for dropdown
  const getActions = (report: OvernightReport) => {
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

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if any filters are active (excluding month/year since it's default)
  const hasActiveFilters =
    statusFilter !== "all" ||
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
          <Moon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý báo cáo qua đêm</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Theo dõi và quản lý các báo cáo vị trí qua đêm của nhân viên
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={!factoryId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Xuất Excel
        </button>
      </div>

      {/* Search and Filters */}
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
                { value: "reported", label: "Đã báo cáo" },
                { value: "confirmed", label: "Đã xác nhận" },
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
                placeholder="Tìm kiếm theo địa chỉ, nhân viên, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("all");
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
            icon: <Moon className="h-5 w-5" />,
            bgColor: "blue",
          },
          {
            value: statistics.byStatus.reported,
            label: "Đã báo cáo",
            icon: <MapPin className="h-5 w-5" />,
            bgColor: "indigo",
          },
          {
            value: statistics.byStatus.confirmed,
            label: "Đã xác nhận",
            icon: <CheckCircle2 className="h-5 w-5" />,
            bgColor: "green",
          },
          {
            value: statistics.today,
            label: "Hôm nay",
            icon: <Clock className="h-5 w-5" />,
            bgColor: "orange",
          },
        ]}
        gridCols="md:grid-cols-4"
      />

      {/* Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">Danh sách Báo cáo qua đêm</h2>
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
                    <span className="font-medium text-gray-900">{report.address || 'Chưa có địa chỉ'}</span>
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
                    {report.employee?.position && (
                      <div>
                        <span className="text-gray-500">Chức vụ:</span> {report.employee.position?.name || '-'}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Ngày:</span> {formatDate(report.reportDate)}
                    </div>
                    <div>
                      <span className="text-gray-500">Giờ báo cáo:</span> {formatTime(report.reportTime)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}
                      >
                        {getStatusLabel(report.status)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chức vụ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa điểm qua đêm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giờ báo cáo
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
              {displayItems.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.employee?.user?.fullName || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.employee?.department?.name || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.employee?.position?.name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{report.address || 'Chưa có địa chỉ'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(report.reportDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(report.reportTime)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-left">
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
            {searchTerm.trim() ? "Không tìm thấy kết quả phù hợp" : `Không có báo cáo qua đêm tháng ${selectedMonth + 1} năm ${selectedYear}`}
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
      <OvernightReportDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
      />

      {/* Export Modal */}
      {factoryId && (
        <ExportOvernightReportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          factoryId={factoryId}
        />
      )}
    </div>
  );
}
