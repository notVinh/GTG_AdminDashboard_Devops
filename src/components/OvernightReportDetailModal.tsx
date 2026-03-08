import { X, MapPin, Clock, Calendar, User, Briefcase, Building2, FileText, Moon, Users, Image } from 'lucide-react';
import type { OvernightReport } from '../types';

interface OvernightReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: OvernightReport | null;
}

export default function OvernightReportDetailModal({
  isOpen,
  onClose,
  report,
}: OvernightReportDetailModalProps) {
  if (!isOpen || !report) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    if (report.status === 'confirmed') {
      return <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">Đã xác nhận</span>;
    }
    return <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">Đã báo cáo</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Moon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết báo cáo qua đêm</h2>
              <div className="text-sm text-gray-500 mt-1">
                {formatDate(report.reportDate)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
              <div>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="space-y-4">
            {/* Address */}
            {report.address && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Địa điểm qua đêm</h4>
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {report.address}
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-semibold text-indigo-900">Ngày báo cáo</h4>
                </div>
                <div className="text-xl font-bold text-indigo-700">
                  {formatDate(report.reportDate)}
                </div>
              </div>

              {/* Time */}
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Giờ báo cáo</h4>
                </div>
                <div className="text-xl font-bold text-purple-700">
                  {formatTime(report.reportTime)}
                </div>
              </div>
            </div>

            {/* Location */}
            {report.location && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Vị trí GPS</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Tọa độ:</span>{' '}
                    <span className="font-mono">
                      {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                  >
                    <MapPin className="h-4 w-4" />
                    Xem trên Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Receivers */}
            {report.receivers && report.receivers.length > 0 && (
              <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-teal-600" />
                  <h4 className="font-semibold text-teal-900">Người nhận báo cáo</h4>
                </div>
                <div className="space-y-2">
                  {report.receivers.map((receiver) => (
                    <div key={receiver.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-teal-100">
                      <div className="p-1.5 bg-teal-100 rounded-full">
                        <User className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {receiver.user?.fullName || '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {receiver.position?.name || ''} {receiver.department?.name ? `- ${receiver.department.name}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {report.photoUrls && report.photoUrls.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Image className="h-5 w-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Ảnh xác nhận</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.photoUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                    >
                      <img
                        src={url}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {report.note && (
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Ghi chú</h4>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {report.note}
                </p>
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
