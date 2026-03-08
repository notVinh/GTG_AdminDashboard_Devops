import { useState, useEffect, useMemo } from 'react';
import { Calendar, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { leaveRequestApi } from '../../api/leave-request';
import type { EmployeeWithDetails, LeaveRequest, LeaveRequestStatus } from '../../types';
import MonthNavigation from '../commons/MonthNavigation';
import { getMonthYearLabel } from '../../utils/dateHelpers';

interface EmployeeLeaveRequestsProps {
  employee: EmployeeWithDetails;
}

const statusConfig: Record<LeaveRequestStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
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
  hr_confirmed: {
    label: 'HR đã xác nhận',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
  },
};

// Helper: Lấy tên loại nghỉ phép, ưu tiên từ leaveTypeRef nếu có
const getLeaveTypeName = (request: LeaveRequest) => {
  if (request.leaveTypeRef?.name) {
    return request.leaveTypeRef.name;
  }
  // Fallback cho dữ liệu cũ
  return request.leaveType === 'paid' ? 'Có lương' : 'Không lương';
};

const EmployeeLeaveRequests = ({ employee }: EmployeeLeaveRequestsProps) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await leaveRequestApi.getByEmployee(employee.id);
        // Sort by startDate descending (newest first)
        setLeaveRequests(data.sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ));
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setError('Không thể tải danh sách đơn xin nghỉ phép');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [employee.id]);

  // Filter by month/year
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const startDate = new Date(request.startDate);
      return startDate.getMonth() === selectedMonth && startDate.getFullYear() === selectedYear;
    });
  }, [leaveRequests, selectedMonth, selectedYear]);

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
    const pending = filteredLeaveRequests.filter(r => r.status === 'pending').length;
    const approved = filteredLeaveRequests.filter(r => r.status === 'approved').length;
    const totalDaysApproved = filteredLeaveRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + Number(r.totalDays || 0), 0);

    return { pending, approved, totalDaysApproved };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách đơn...</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Đơn xin nghỉ phép</h2>
            <p className="text-sm text-gray-600 mt-1">
              Danh sách tất cả các đơn xin nghỉ phép của {employee.user?.fullName || '-'}
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
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng ngày nghỉ</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalDaysApproved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {filteredLeaveRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có đơn xin nghỉ phép trong tháng này
            </h3>
            <p className="text-gray-600">
              {employee.user?.fullName || '-'} chưa tạo đơn xin nghỉ phép nào trong {getMonthYearLabel(selectedMonth, selectedYear).toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeaveRequests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon;
              return (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`
                          inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border
                          ${statusConfig[request.status].color}
                        `}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusConfig[request.status].label}</span>
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${request.leaveTypeRef?.isPaid !== false && request.leaveType === 'paid' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {getLeaveTypeName(request)}
                        </span>
                      </div>

                      {/* Date Range */}
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({request.totalDays} ngày)
                        </span>
                      </div>

                      {/* Reason */}
                      {request.reason && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Lý do:</span> {request.reason}
                          </p>
                        </div>
                      )}

                      {/* Decision Note */}
                      {request.decisionNote && (
                        <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Ghi chú phê duyệt:</span> {request.decisionNote}
                          </p>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Tạo: {formatDate(request.createdAt)}
                        </span>
                        {request.decidedAt && (
                          <span>
                            Quyết định: {formatDate(request.decidedAt)}
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

export default EmployeeLeaveRequests;
