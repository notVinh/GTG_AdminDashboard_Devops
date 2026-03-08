import { X, Calendar, Clock, User, Briefcase, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { LeaveRequest } from '../types';

interface LeaveRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequest | null;
}

export default function LeaveRequestDetailModal({
  isOpen,
  onClose,
  leaveRequest,
}: LeaveRequestDetailModalProps) {
  if (!isOpen || !leaveRequest) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string; icon: typeof AlertCircle }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ duyệt', icon: AlertCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã duyệt', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Từ chối', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Đã hủy', icon: XCircle },
      hr_confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'HR đã xác nhận', icon: CheckCircle },
    };

    const config = statusConfig[leaveRequest.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  // Helper: Lấy tên loại nghỉ phép, ưu tiên từ leaveTypeRef
  const getLeaveTypeLabel = () => {
    if (leaveRequest.leaveTypeRef?.name) {
      return leaveRequest.leaveTypeRef.name;
    }
    return leaveRequest.leaveType === 'paid' ? 'Nghỉ có lương' : 'Nghỉ không lương';
  };

  const getLeaveSessionLabel = (session: string) => {
    const labels = {
      full_day: 'Cả ngày',
      morning: 'Buổi sáng',
      afternoon: 'Buổi chiều',
    };
    return labels[session as keyof typeof labels] || session;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Chi tiết đơn nghỉ phép</h2>
            <div className="text-sm text-gray-500 mt-1">
              {formatDateShort(leaveRequest.startDate)} - {formatDateShort(leaveRequest.endDate)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {leaveRequest.employee?.user?.fullName || `#${leaveRequest.employeeId}`}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>Nhân viên</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Leave Request Details */}
          <div className="space-y-6">
            {/* Leave Information */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thông tin nghỉ phép
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Loại phép</p>
                  <p className="font-medium text-gray-900">{getLeaveTypeLabel()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Buổi nghỉ</p>
                  <p className="font-medium text-gray-900">{getLeaveSessionLabel(leaveRequest.leaveSession)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                  <p className="font-medium text-gray-900">{formatDate(leaveRequest.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày kết thúc</p>
                  <p className="font-medium text-gray-900">{formatDate(leaveRequest.endDate)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Tổng số ngày nghỉ</p>
                  <p className="font-medium text-lg text-purple-700">
                    {leaveRequest.totalDays || 0} ngày
                  </p>
                </div>
              </div>
            </div>

            {/* Approver Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin phê duyệt</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Người được giao duyệt</p>
                  {leaveRequest.approvers && leaveRequest.approvers.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {leaveRequest.approvers.map((approver) => (
                        <span
                          key={approver.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-sm bg-blue-100 text-blue-800"
                        >
                          {approver.user?.fullName || `#${approver.id}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">
                      {leaveRequest.approver?.user?.fullName || `#${leaveRequest.approverEmployeeId}`}
                    </p>
                  )}
                </div>
                {/* Hiển thị người đã duyệt nếu đơn đã được xử lý */}
                {leaveRequest.decidedBy && (leaveRequest.status === 'approved' || leaveRequest.status === 'rejected') && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {leaveRequest.status === 'approved' ? 'Người đã duyệt' : 'Người đã từ chối'}
                    </p>
                    <p className={`font-medium ${leaveRequest.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                      {leaveRequest.decidedBy.user?.fullName || `#${leaveRequest.decidedByEmployeeId}`}
                    </p>
                  </div>
                )}
                {leaveRequest.decidedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Thời gian quyết định</p>
                    <p className="font-medium text-gray-900">
                      {new Date(leaveRequest.decidedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reason */}
            {leaveRequest.reason && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Lý do nghỉ phép</h3>
                <p className="text-gray-700">{leaveRequest.reason}</p>
              </div>
            )}

            {/* Decision Note */}
            {leaveRequest.decisionNote && (
              <div className={`border rounded-lg p-4 ${
                leaveRequest.status === 'approved'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  leaveRequest.status === 'approved' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {leaveRequest.status === 'approved' ? 'Ghi chú phê duyệt' : 'Lý do từ chối'}
                </h3>
                <p className={leaveRequest.status === 'approved' ? 'text-green-700' : 'text-red-700'}>
                  {leaveRequest.decisionNote}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin hệ thống</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {leaveRequest.createdAt && (
                  <div>
                    <p className="text-gray-600">Ngày tạo đơn</p>
                    <p className="font-medium text-gray-900">
                      {new Date(leaveRequest.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
                {leaveRequest.updatedAt && (
                  <div>
                    <p className="text-gray-600">Cập nhật lần cuối</p>
                    <p className="font-medium text-gray-900">
                      {new Date(leaveRequest.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
