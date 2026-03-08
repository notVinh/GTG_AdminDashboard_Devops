import { X, Wrench, Clock, Calendar, User, Briefcase, Building2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { MaintenanceReport, MaintenanceReportStatus, MaintenanceReportPriority } from '../types';

interface MaintenanceReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MaintenanceReport | null;
}

export default function MaintenanceReportDetailModal({
  isOpen,
  onClose,
  report,
}: MaintenanceReportDetailModalProps) {
  if (!isOpen || !report) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: MaintenanceReportStatus) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý', icon: AlertCircle },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đang xử lý', icon: Clock },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã hoàn thành', icon: CheckCircle2 },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Đã hủy', icon: X },
    };
    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${statusConfig.bg} ${statusConfig.text}`}>
        <Icon className="h-4 w-4" />
        {statusConfig.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: MaintenanceReportPriority) => {
    const config = {
      low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Thấp' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Trung bình' },
      high: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Cao' },
      urgent: { bg: 'bg-red-100', text: 'text-red-600', label: 'Khẩn cấp' },
    };
    const priorityConfig = config[priority] || config.medium;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}>
        <AlertCircle className="h-4 w-4" />
        {priorityConfig.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chi tiết báo cáo máy hỏng</h2>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(report.reportDate)}
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
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {report.employee?.user?.fullName || '—'}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span>{report.employee?.position?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{report.employee?.department?.name || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {getStatusBadge(report.status)}
                {getPriorityBadge(report.priority)}
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="space-y-4">
            {/* Machine Info */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Thông tin máy móc</h4>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium text-gray-900">
                  {report.machineName}
                </div>
                {report.machineCode && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Mã máy:</span> <span className="font-mono">{report.machineCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Issue Description */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Mô tả vấn đề</h4>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {report.issueDescription}
              </p>
            </div>

            {/* Date and Assigned Employee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Report Date */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Ngày báo cáo</h4>
                </div>
                <div className="text-lg font-semibold text-blue-700">
                  {formatDate(report.reportDate)}
                </div>
              </div>

              {/* Assigned Employee */}
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Người xử lý</h4>
                </div>
                <div className="text-lg font-semibold text-purple-700">
                  {report.assignedEmployee?.user?.fullName || 'Chưa giao'}
                </div>
              </div>
            </div>

            {/* Note */}
            {report.note && (
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Ghi chú ban đầu</h4>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {report.note}
                </p>
              </div>
            )}

            {/* Resolution Info */}
            {report.status === 'resolved' && report.resolvedAt && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Thông tin hoàn thành</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Hoàn thành lúc:</span>{' '}
                    <span className="font-semibold">{formatDateTime(report.resolvedAt)}</span>
                  </div>
                  {report.resolvedNote && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Ghi chú xử lý:</div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {report.resolvedNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-200 pt-4">
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  <span className="font-medium">Tạo lúc:</span>{' '}
                  {new Date(report.createdAt).toLocaleString('vi-VN')}
                </div>
                {report.updatedAt && report.updatedAt !== report.createdAt && (
                  <div>
                    <span className="font-medium">Cập nhật lúc:</span>{' '}
                    {new Date(report.updatedAt).toLocaleString('vi-VN')}
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
