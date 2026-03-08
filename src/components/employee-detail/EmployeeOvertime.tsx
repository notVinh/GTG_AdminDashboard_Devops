import { useState, useEffect, useMemo } from 'react';
import { Clock, TrendingUp, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { overtimeApi } from '../../api/overtime';
import type { EmployeeWithDetails, Overtime, OvertimeStatus } from '../../types';
import MonthNavigation from '../commons/MonthNavigation';
import { getMonthYearLabel } from '../../utils/dateHelpers';

interface EmployeeOvertimeProps {
  employee: EmployeeWithDetails;
}

const statusConfig: Record<OvertimeStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: {
    label: 'Chờ duyệt',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  approved: {
    label: 'Đã duyệt',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertCircle,
  },
};

const overtimeRateLabels: Record<number, string> = {
  1.5: 'Ngày thường (1.5x)',
  2.0: 'Cuối tuần (2.0x)',
  3.0: 'Lễ/Tết (3.0x)',
};

const EmployeeOvertime = ({ employee }: EmployeeOvertimeProps) => {
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchOvertimes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await overtimeApi.getByEmployee(employee.id);
        // Sort by overtimeDate descending (newest first)
        setOvertimes(
          data.sort((a, b) => {
            const dateCompare = new Date(b.overtimeDate).getTime() - new Date(a.overtimeDate).getTime();
            if (dateCompare !== 0) return dateCompare;
            // If same date, sort by createdAt
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          })
        );
      } catch (err) {
        console.error('Error fetching overtimes:', err);
        setError('Không thể tải danh sách đơn tăng ca');
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimes();
  }, [employee.id]);

  // Filter by month/year
  const filteredOvertimes = useMemo(() => {
    return overtimes.filter((overtime) => {
      const overtimeDate = new Date(overtime.overtimeDate);
      return overtimeDate.getMonth() === selectedMonth && overtimeDate.getFullYear() === selectedYear;
    });
  }, [overtimes, selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const calculateStats = () => {
    const pending = filteredOvertimes.filter(r => r.status === 'pending').length;
    const approved = filteredOvertimes.filter(r => r.status === 'approved').length;
    const totalHoursApproved = filteredOvertimes
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (Number(r.totalHours) || 0), 0);

    return {
      pending,
      approved,
      totalHoursApproved: Number(totalHoursApproved) || 0
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách tăng ca...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-12">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Lỗi</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Đăng ký tăng ca</h2>
            <p className="text-sm text-gray-600 mt-1">
              Danh sách tất cả các đơn đăng ký tăng ca của {employee.user?.fullName || '-'}
            </p>
          </div>
          <MonthNavigation
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Chờ duyệt</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã duyệt</p>
              <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng giờ tăng ca</p>
              <p className="text-xl font-bold text-gray-900">{(Number(stats.totalHoursApproved) || 0).toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {filteredOvertimes.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có đơn tăng ca trong tháng này
            </h3>
            <p className="text-gray-600">
              {employee.user?.fullName || '-'} chưa đăng ký tăng ca nào trong {getMonthYearLabel(selectedMonth, selectedYear).toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOvertimes.map((overtime) => {
              const StatusIcon = statusConfig[overtime.status].icon;
              const rateLabel = overtimeRateLabels[overtime.overtimeRate] || `${overtime.overtimeRate}x`;

              return (
                <div
                  key={overtime.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`
                          inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border
                          ${statusConfig[overtime.status].color}
                        `}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusConfig[overtime.status].label}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {rateLabel}
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(overtime.overtimeDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 ml-6">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {overtime.startTime} - {overtime.endTime}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({overtime.totalHours || 0} giờ)
                          </span>
                        </div>
                      </div>

                      {/* Reason */}
                      {overtime.reason && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Lý do:</span> {overtime.reason}
                          </p>
                        </div>
                      )}

                      {/* Decision Note */}
                      {overtime.decisionNote && (
                        <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Ghi chú phê duyệt:</span> {overtime.decisionNote}
                          </p>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Tạo: {formatDate(overtime.createdAt)}
                        </span>
                        {overtime.decidedAt && (
                          <span>
                            Quyết định: {formatDate(overtime.decidedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeOvertime;
