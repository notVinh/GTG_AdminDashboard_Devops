import { useEffect, useMemo, useState, useRef } from "react";
import {
  Users,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  ChevronDown,
  Download,
  Clock,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import { usersApi } from "../../api/users";
import { attendanceApi } from "../../api/attendance";
import { teamApi } from "../../api/team";
import type { Department, Team } from "../../types/department";
import type { EmployeeWithDetails } from "../../types";
import ErrorMessage from "../../components/commons/ErrorMessage";
import ExportAttendanceModal from "../../components/ExportAttendanceModal";
import AttendanceDetailModal from "../../components/AttendanceDetailModal";
import { holidayApi, type Holiday } from "../../api/holiday";
import MonthNavigation from "../../components/commons/MonthNavigation";

type AttendanceStatus = "present" | "absent" | "leave" | "off";
type ViewMode = "week" | "month";

type Employee = EmployeeWithDetails;

interface Factory {
  id: number;
  name: string;
  address: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

type AttendanceRecord = {
  id?: number;
  dateISO: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeMinutes?: number;
  overtimeNote?: string;
  status: AttendanceStatus;
  checkInLocation?: any;
  checkOutLocation?: any;
  checkInAddress?: string;
  checkOutAddress?: string;
  checkInPhotoUrl?: string;
  checkOutPhotoUrl?: string;
};

function getDaysInMonth(year: number, monthIndexZeroBased: number): number {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

// Format Date object to YYYY-MM-DD in local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get start and end of week (Monday to Sunday)
function getWeekDates(year: number, month: number, day: number): Date[] {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Move to Monday

  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
  }

  return weekDates;
}

export default function MyFactoryAttendance() {
  // Employee and factory data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [factory, setFactory] = useState<Factory | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [managerFilter, setManagerFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    departmentFilter !== "" ||
    teamFilter !== "" ||
    managerFilter !== "";

  // Calendar and attendance
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(
    new Date().getMonth()
  ); // 0-11
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<
    Map<number, AttendanceRecord[]>
  >(new Map());

  // Work days settings - load from factory data
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default to Mon-Fri

  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Loading and error states
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );

  // Refs for synced horizontal scrollbars
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Sync scroll positions
  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setHasError(false);

      // Load factory info
      const factoryData = await usersApi.getMyFactory();
      setFactory(factoryData);

      // Load work days from factory data
      if (factoryData.workDays) {
        setWorkDays(factoryData.workDays);
      }

      // Load employees - load all employees for attendance view
      setLoadingEmployees(true);
      const employeesData = await employeeApi.listEmployeesWithDetails(
        1,
        10000, // Load all employees for attendance view
        factoryData.id
      );
      setEmployees(employeesData.data || []);

      // Load departments
      try {
        const deps = await departmentApi.getAll(+factoryData.id);
        setDepartments(deps || []);
      } catch (_) {
        setDepartments([]);
      }

      // Load teams
      try {
        const teamList = await teamApi.getAll(+factoryData.id);
        setTeams(teamList || []);
      } catch (_) {
        setTeams([]);
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      const message =
        err?.message ||
        err?.data?.errors?.message ||
        "Có lỗi xảy ra khi tải dữ liệu";
      setError(message);
      setHasError(true);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadHolidays = async () => {
    if (!factory) return;

    try {
      // Get year from display dates
      const year = displayDates[0]?.getFullYear() || new Date().getFullYear();
      const holidaysData = await holidayApi.getAll(factory.id, year);
      setHolidays(holidaysData || []);
    } catch (err) {
      console.error("Error loading holidays:", err);
      setHolidays([]);
    }
  };

  // Get dates to display based on view mode
  const displayDates = useMemo(() => {
    if (viewMode === "week") {
      return getWeekDates(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
    } else {
      // Month view
      const days = getDaysInMonth(currentYear, currentMonthIndex);
      return Array.from({ length: days }).map(
        (_, idx) => new Date(currentYear, currentMonthIndex, idx + 1)
      );
    }
  }, [viewMode, currentYear, currentMonthIndex, currentDate]);

  // Load holidays when factory or dates change
  useEffect(() => {
    if (!factory) return;
    loadHolidays();
  }, [factory, displayDates]);

  // Load attendance for all employees when dates change
  useEffect(() => {
    if (employees.length === 0 || !factory) return;
    loadAllAttendance();
  }, [employees, displayDates, workDays, factory]);

  const loadAllAttendance = async () => {
    if (!factory) return;

    setLoadingAttendance(true);
    const newAttendanceData = new Map<number, AttendanceRecord[]>();

    try {
      const startDate = displayDates[0];
      const endDate = displayDates[displayDates.length - 1];

      // Format dates as YYYY-MM-DD for API (use local timezone)
      const startDateStr = formatDateLocal(startDate);
      const endDateStr = formatDateLocal(endDate);

      // Gọi API một lần duy nhất để lấy toàn bộ dữ liệu chấm công của nhà máy
      const factoryAttendanceData =
        await attendanceApi.getFactoryAttendanceByDateRange(
          factory.id,
          startDateStr,
          endDateStr,
          1,
          10000 // Lấy nhiều records để đảm bảo không bị phân trang
        );

      // Group attendance records theo employeeId
      const attendanceByEmployee = new Map<number, any[]>();
      factoryAttendanceData.data.forEach((record: any) => {
        // Convert employeeId to number để ensure consistency
        const employeeId = Number(record.employeeId);
        if (!attendanceByEmployee.has(employeeId)) {
          attendanceByEmployee.set(employeeId, []);
        }
        attendanceByEmployee.get(employeeId)!.push(record);
      });

      // Tạo attendance records cho từng nhân viên
      employees.forEach((emp) => {
        // Convert emp.id to number để ensure consistency
        const employeeRecords = attendanceByEmployee.get(Number(emp.id)) || [];

        const records: AttendanceRecord[] = displayDates.map((date) => {
          const dateStr = formatDateLocal(date);

          // Find matching record from API - compare dates only (not time)
          const apiRecord = employeeRecords.find((record: any) => {
            // Get date part from attendanceDate (which might include time)
            const recordDateStr = record.attendanceDate.split("T")[0];
            return recordDateStr === dateStr;
          });

          if (apiRecord) {
            const checkInTime = apiRecord.checkInTime
              ? new Date(apiRecord.checkInTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined;
            const checkOutTime = apiRecord.checkOutTime
              ? new Date(apiRecord.checkOutTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined;

            return {
              id: Number(apiRecord.id),
              dateISO: dateStr,
              checkIn: checkInTime,
              checkOut: checkOutTime,
              lateMinutes: Number(apiRecord.lateMinutes) || 0,
              earlyLeaveMinutes: Number(apiRecord.earlyLeaveMinutes) || 0,
              overtimeMinutes: apiRecord.overtimeHours
                ? Math.round(Number(apiRecord.overtimeHours) * 60)
                : 0,
              overtimeNote: apiRecord.overtimeNote,
              status: apiRecord.checkInTime ? "present" : "absent",
              checkInLocation: apiRecord.checkInLocation,
              checkOutLocation: apiRecord.checkOutLocation,
              checkInAddress: apiRecord.checkInAddress,
              checkOutAddress: apiRecord.checkOutAddress,
              checkInPhotoUrl: apiRecord.checkInPhotoUrl,
              checkOutPhotoUrl: apiRecord.checkOutPhotoUrl,
            } as AttendanceRecord;
          } else {
            // No record - check if it's a work day
            const dayOfWeek = date.getDay();
            const isWorkDay = workDays.includes(dayOfWeek);

            return {
              dateISO: dateStr,
              status: isWorkDay ? "absent" : "off",
            } as AttendanceRecord;
          }
        });

        newAttendanceData.set(emp.id, records);
      });

      setAttendanceData(newAttendanceData);
    } catch (err) {
      console.error("Error loading attendance data:", err);
      // Create empty records for all employees on error
      employees.forEach((emp) => {
        const records: AttendanceRecord[] = displayDates.map((date) => ({
          dateISO: formatDateLocal(date),
          status: "off",
        }));
        newAttendanceData.set(emp.id, records);
      });
      setAttendanceData(newAttendanceData);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    // Chỉ kiểm tra emp và user, không bắt buộc phải có position
    if (!emp || !emp.user) {
      return false;
    }

    const matchesSearch =
      emp.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user.phone?.includes(searchTerm) ||
      emp.position?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm === "";

    const deptId =
      (emp as any).position?.departmentId || (emp as any).department?.id;
    const matchesDepartment =
      !departmentFilter || String(deptId ?? "") === String(departmentFilter);
    const matchesTeam =
      !teamFilter || String((emp as any).teamId ?? "") === String(teamFilter);
    const matchesManager =
      !managerFilter ||
      String(emp.isManager ?? false) === String(managerFilter);

    return matchesSearch && matchesDepartment && matchesTeam && matchesManager;
  });

  // Update table width for top scrollbar
  useEffect(() => {
    if (tableRef.current) {
      setTableWidth(tableRef.current.scrollWidth);
    }
  }, [displayDates, filteredEmployees]);

  const periodLabel = useMemo(() => {
    if (viewMode === "week") {
      const start = displayDates[0];
      const end = displayDates[displayDates.length - 1];
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${
        end.getMonth() + 1
      }/${end.getFullYear()}`;
    } else {
      return new Date(currentYear, currentMonthIndex, 1).toLocaleDateString(
        "vi-VN",
        { month: "long", year: "numeric" }
      );
    }
  }, [viewMode, currentYear, currentMonthIndex, displayDates]);

  const prevPeriod = () => {
    if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const d = new Date(currentYear, currentMonthIndex, 1);
      d.setMonth(d.getMonth() - 1);
      setCurrentYear(d.getFullYear());
      setCurrentMonthIndex(d.getMonth());
    }
  };

  const nextPeriod = () => {
    if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const d = new Date(currentYear, currentMonthIndex, 1);
      d.setMonth(d.getMonth() + 1);
      setCurrentYear(d.getFullYear());
      setCurrentMonthIndex(d.getMonth());
    }
  };

  const getAttendanceCell = (employeeId: number, dateIndex: number) => {
    const records = attendanceData.get(employeeId);
    if (!records || dateIndex >= records.length) return null;
    return records[dateIndex];
  };

  const isHoliday = (dateStr: string): Holiday | null => {
    return holidays.find((h) => h.date === dateStr) || null;
  };

  const getCellClass = (record: AttendanceRecord | null) => {
    if (!record) return "bg-gray-100";

    const hasOvertime = record.overtimeMinutes && record.overtimeMinutes > 0;

    // Kiểm tra ngày lễ - màu tím
    if (isHoliday(record.dateISO)) {
      if (hasOvertime) {
        return "bg-gradient-to-br from-purple-100 from-50% to-blue-400 to-50% hover:from-purple-200 hover:to-yellow-200";
      }
      return "bg-purple-100 hover:bg-purple-200";
    }

    // Ngày không làm việc - màu xám
    if (record.status === "off") {
      if (hasOvertime) {
        return "bg-gradient-to-br from-gray-100 from-50% to-blue-400 to-50% hover:from-gray-200 hover:to-yellow-200";
      }
      return "bg-gray-100 hover:bg-gray-200";
    }

    // Ngày làm việc nhưng không chấm công - màu đỏ
    if (record.status === "absent" || !record.checkIn) {
      if (hasOvertime) {
        return "bg-gradient-to-br from-red-100 from-50% to-blue-400 to-50% hover:from-red-200 hover:to-yellow-200";
      }
      return "bg-red-100 hover:bg-red-200";
    }

    // Có chấm công
    if (record.status === "present" || record.checkIn) {
      // Đi làm muộn/về sớm - màu cam
      if (
        (record.lateMinutes && record.lateMinutes > 0) ||
        (record.earlyLeaveMinutes && record.earlyLeaveMinutes > 0)
      ) {
        if (hasOvertime) {
          return "bg-gradient-to-br from-orange-100 from-50% to-blue-400 to-50% hover:from-orange-200 hover:to-yellow-200";
        }
        return "bg-orange-100 hover:bg-orange-200";
      }
      // Đi làm đúng giờ - màu xanh
      if (hasOvertime) {
        return "bg-gradient-to-br from-green-100 from-50% to-blue-400 to-50% hover:from-green-200 hover:to-yellow-200";
      }
      return "bg-green-100 hover:bg-green-200";
    }

    return "bg-gray-100";
  };

  const getCellContent = (
    record: AttendanceRecord | null,
    isMonthView: boolean
  ) => {
    if (!record) {
      return (
        <div className="text-[10px] text-gray-400 text-center">
          <div>-:-</div>
          <div>-:-</div>
        </div>
      );
    }

    // Bỏ icon/label ngày lễ, chỉ hiển thị màu và giờ

    // Ngày không làm việc - hiển thị -
    if (record.status === "off") {
      return <div className="text-gray-400 text-center">-</div>;
    }

    const checkInDisplay = record.checkIn || "-:-";
    const checkOutDisplay = record.checkOut || "-:-";

    if (isMonthView) {
      // Month view: hiển thị compact
      return (
        <div className="text-[9px] leading-tight text-center">
          <div className="text-gray-700">{checkInDisplay}</div>
          <div className="text-gray-700">{checkOutDisplay}</div>
        </div>
      );
    } else {
      // Week view: hiển thị rõ ràng hơn
      return (
        <div className="text-[10px] leading-tight text-center">
          <div className="text-gray-700 font-medium">{checkInDisplay}</div>
          <div className="text-gray-700">{checkOutDisplay}</div>
          {record.lateMinutes && record.lateMinutes > 0 ? (
            <div className="text-orange-600 font-semibold text-[9px] mt-0.5">
              Muộn {record.lateMinutes}p
            </div>
          ) : null}
        </div>
      );
    }
  };

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Đã xảy ra lỗi
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              loadData();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const isMonthView = viewMode === "month";
  const cellWidth = isMonthView ? "w-16" : "w-20";
  const cellHeight = isMonthView ? "h-12" : "h-16";

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-semibold">
            Quản lý chấm công
          </h1>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Xuất file
        </button>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage error={error} setError={setError} />}

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: View Mode Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">
                Chế độ xem:
              </span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === "week"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Tuần
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === "month"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Tháng
                </button>
              </div>
            </div>

            {/* Filter Buttons - visible on mobile */}
            <div className="flex sm:hidden gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-3.5 w-3.5" />
                {showFilters ? "Ẩn" : "Lọc"}
              </button>
              {showFilters && hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDepartmentFilter("");
                    setTeamFilter("");
                    setManagerFilter("");
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:text-red-800 border border-gray-300 rounded-lg hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Date Navigation + Filter Button (desktop) */}
          <div className="flex items-center justify-between gap-2">
            <MonthNavigation
              label={periodLabel}
              onPrevMonth={prevPeriod}
              onNextMonth={nextPeriod}
              onToday={() => {
                const today = new Date();
                setCurrentDate(today);
                setCurrentYear(today.getFullYear());
                setCurrentMonthIndex(today.getMonth());
              }}
              showTodayButton={true}
              showCalendarIcon={false}
              minWidth="min-w-[120px] sm:min-w-[180px]"
            />

            {/* Filter Buttons - visible on desktop */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ẩn bộ lọc" : "Lọc"}
              </button>
              {showFilters && hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDepartmentFilter("");
                    setTeamFilter("");
                    setManagerFilter("");
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm text-red-600 hover:text-red-800 border border-gray-300 rounded-lg hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Department Filter */}
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setTeamFilter("");
                  }}
                  className="w-full p-2 pr-8 border border-gray-300 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Team Filter - only show if department selected and has teams */}
              {departmentFilter && teams.filter(t => String(t.departmentId) === String(departmentFilter)).length > 0 && (
                <div className="relative">
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="w-full p-2 pr-8 border border-gray-300 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả tổ</option>
                    {teams
                      .filter(
                        (t) =>
                          String(t.departmentId) === String(departmentFilter)
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Manager Filter */}
              <div className="relative">
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="w-full p-2 pr-8 border border-gray-300 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả chức vụ</option>
                  <option value="true">Quản lý</option>
                  <option value="false">Nhân viên</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 mb-4">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 sm:flex-wrap text-[10px] sm:text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-green-100 border border-green-300 flex-shrink-0"></span>
            <span className="truncate">Đúng giờ</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-orange-100 border border-orange-300 flex-shrink-0"></span>
            <span className="truncate">Muộn/sớm</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-gradient-to-br from-green-100 from-50% to-blue-500 to-50% border border-green-300 flex-shrink-0"></span>
            <span className="truncate">Tăng ca</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-red-100 border border-red-300 flex-shrink-0"></span>
            <span className="truncate">Vắng mặt</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-purple-100 border border-purple-300 flex-shrink-0"></span>
            <span className="truncate">Nghỉ lễ</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-gray-100 border border-gray-300 flex-shrink-0"></span>
            <span className="truncate">Không làm</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
            <span className="truncate">Giờ riêng</span>
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loadingEmployees || loadingAttendance ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mr-3" />
            <span className="text-gray-600">Đang tải dữ liệu chấm công...</span>
          </div>
        ) : (
          <>
            {/* Top horizontal scrollbar */}
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="overflow-x-auto overflow-y-hidden"
              style={{ height: '17px' }}
            >
              <div style={{ width: tableWidth, height: '1px' }} />
            </div>

            <div
              ref={bottomScrollRef}
              onScroll={handleBottomScroll}
              className="overflow-x-auto"
            >
            <table ref={tableRef} className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[200px]">
                    Nhân viên
                  </th>
                  {displayDates.map((date, idx) => {
                    const dayOfWeek = date.getDay();
                    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

                    return (
                      <th
                        key={idx}
                        className={`${cellWidth} px-2 py-3 text-center text-xs font-medium border-r border-gray-200`}
                      >
                        <div
                          className={`${
                            isMonthView ? "text-[10px]" : "text-xs"
                          }`}
                        >
                          <div className="font-semibold text-gray-700">
                            {dayNames[dayOfWeek]}
                          </div>
                          <div className="text-gray-500">
                            {date.getDate()}/{date.getMonth() + 1}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayDates.length + 1}
                      className="text-center py-8 text-gray-500"
                    >
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const hasCustomHours = (emp as any).hourStartWork || (emp as any).hourEndWork;
                    // Format time từ HH:mm:ss thành HH:mm
                    const formatTime = (time: string) => {
                      if (!time) return '--:--';
                      return time.substring(0, 5); // "08:00:00" → "08:00"
                    };
                    const customHoursText = hasCustomHours
                      ? `${formatTime((emp as any).hourStartWork)} - ${formatTime((emp as any).hourEndWork)}`
                      : '';

                    return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 border-r border-gray-200 min-w-[200px]">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 flex items-center gap-1">
                            {emp.user?.fullName || '-'}
                            {hasCustomHours && (
                              <span
                                className="inline-flex items-center"
                                title={`Giờ làm việc riêng: ${customHoursText}`}
                              >
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {emp.position?.name || "—"}
                            {emp.isManager && (
                              <span className="ml-2 inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                                QL
                              </span>
                            )}
                            {hasCustomHours && (
                              <span className="ml-2 inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                {customHoursText}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {displayDates.map((date, dateIdx) => {
                        const record = getAttendanceCell(emp.id, dateIdx);

                        return (
                          <td
                            key={dateIdx}
                            className={`${cellWidth} ${cellHeight} px-1 py-1 text-center text-xs border cursor-pointer transition-all ${getCellClass(
                              record
                            )}`}
                            title={
                              record
                                ? `${
                                    emp.user?.fullName || '-'
                                  } - ${date.toLocaleDateString("vi-VN")}\n${
                                    record.checkIn
                                      ? `Vào: ${record.checkIn}`
                                      : ""
                                  }\n${
                                    record.checkOut
                                      ? `Ra: ${record.checkOut}`
                                      : ""
                                  }\nClick để xem chi tiết`
                                : "Click để xem chi tiết"
                            }
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setSelectedDate(date);
                              setSelectedRecord(record);
                              setShowDetailModal(true);
                            }}
                          >
                            {getCellContent(record, isMonthView)}
                          </td>
                        );
                      })}
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {/* Footer Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Hiển thị: {filteredEmployees.length} / {employees.length} nhân viên
      </div>

      {/* Export Modal */}
      {factory && (
        <ExportAttendanceModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          factoryId={factory.id}
        />
      )}

      {/* Attendance Detail Modal */}
      {selectedEmployee && selectedDate && (
        <AttendanceDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEmployee(null);
            setSelectedDate(null);
            setSelectedRecord(null);
          }}
          employee={selectedEmployee}
          date={selectedDate}
          holidayName={
            isHoliday(formatDateLocal(selectedDate))?.name || undefined
          }
          record={selectedRecord}
          onSave={() => {
            // Reload attendance data after successful update
            loadAllAttendance();
          }}
        />
      )}
    </div>
  );
}
