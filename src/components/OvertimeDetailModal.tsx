import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar, User, Briefcase, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import type { Overtime } from '../types';
import { overtimeApi } from '../api/overtime';
import CreateOvertimeModal from './CreateOvertimeModal';
import { employeeApi } from '../api/employee';
import { overtimeCoefficientApi } from '../api/overtime-coefficient';
import type { OvertimeCoefficient } from '../types';

interface OvertimeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  overtime: Overtime | null;
  onRefresh?: () => void; // Callback để reload data sau khi tạo đơn bổ sung
}

export default function OvertimeDetailModal({
  isOpen,
  onClose,
  overtime,
  onRefresh,
}: OvertimeDetailModalProps) {
  const [showCreateSupplementModal, setShowCreateSupplementModal] = useState(false);
  const [overtimeDetail, setOvertimeDetail] = useState<Overtime | null>(overtime);
  const [employeesManager, setEmployeesManager] = useState<any[]>([]);
  const [employeesNotManager, setEmployeesNotManager] = useState<any[]>([]);
  const [coefficients, setCoefficients] = useState<OvertimeCoefficient[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load chi tiết đơn (bao gồm supplements) khi mở modal
  useEffect(() => {
    if (isOpen && overtime?.id) {
      loadOvertimeDetail();
    }
  }, [isOpen, overtime?.id]);

  // Load employees và coefficients khi mở modal tạo đơn bổ sung
  useEffect(() => {
    if (showCreateSupplementModal && overtimeDetail?.factoryId) {
      loadEmployeesAndCoefficients();
    }
  }, [showCreateSupplementModal, overtimeDetail?.factoryId]);

  const loadOvertimeDetail = async () => {
    if (!overtime?.id) return;
    setLoadingDetail(true);
    try {
      const detail = await overtimeApi.getById(overtime.id);
      setOvertimeDetail(detail);
    } catch (error) {
      console.error('Error loading overtime detail:', error);
      setOvertimeDetail(overtime);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadEmployeesAndCoefficients = async () => {
    if (!overtimeDetail?.factoryId) return;
    try {
      const [empList, coeffList] = await Promise.all([
        employeeApi.getByFactory(overtimeDetail.factoryId),
        overtimeCoefficientApi.getByFactory(overtimeDetail.factoryId),
      ]);
      
      const managers = empList.filter((emp: any) => emp.isManager);
      const notManagers = empList.filter((emp: any) => !emp.isManager);
      setEmployeesManager(managers);
      setEmployeesNotManager(notManagers);
      setCoefficients(coeffList);
    } catch (error) {
      console.error('Error loading employees/coefficients:', error);
    }
  };

  const handleCreateSupplementSuccess = async (created: Overtime) => {
    setShowCreateSupplementModal(false);
    // Reload chi tiết đơn để hiển thị đơn bổ sung mới
    await loadOvertimeDetail();
    // Gọi callback để reload danh sách đơn
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!isOpen || !overtimeDetail) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ duyệt', icon: AlertCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã duyệt', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Từ chối', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Đã hủy', icon: XCircle },
    };

    const config = statusConfig[overtimeDetail.status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const getLocation = (location: any) => {
    if (!location) return null;

    // Handle different location formats
    if (typeof location === 'object') {
      if (location.latitude !== undefined && location.longitude !== undefined) {
        return { lat: location.latitude, lng: location.longitude };
      }
      if (location.x !== undefined && location.y !== undefined) {
        return { lat: location.y, lng: location.x };
      }
    }
    return null;
  };

  const requestLoc = getLocation(overtimeDetail.requestLocation);

  const overtimeRateLabel = (rate: number) => {
    if (rate === 1.5) return "1.5x (Ngày thường)";
    if (rate === 2.0) return "2.0x (Cuối tuần)";
    if (rate === 3.0) return "3.0x (Lễ/Tết)";
    return `${rate}x`;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết đơn tăng ca</h2>
              {overtimeDetail.parentOvertimeId && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Đơn bổ sung
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(overtimeDetail.overtimeDate)}
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
                    {overtimeDetail.employee?.user?.fullName || `#${overtimeDetail.employeeId}`}
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

          {/* Overtime Details */}
          <div className="space-y-6">
            {/* Time Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Thông tin ca làm thêm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ngày tăng ca</p>
                  <p className="font-medium text-gray-900">{new Date(overtimeDetail.overtimeDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng số giờ</p>
                  <p className="font-medium text-lg text-amber-700">{overtimeDetail.totalHours || 0} giờ</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hệ số làm thêm</p>
                  {overtimeDetail.coefficientName ? (
                    <div>
                      <p className="font-medium text-gray-900">{overtimeDetail.coefficientName}</p>
                      <p className="text-sm text-gray-500">{overtimeDetail.overtimeRate}x</p>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{overtimeRateLabel(overtimeDetail.overtimeRate)}</p>
                  )}
                </div>
              </div>
              
              {/* Hiển thị nhiều khung giờ nếu có */}
              {overtimeDetail.timeSlots && overtimeDetail.timeSlots.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-amber-300">
                  <p className="text-sm text-gray-600 mb-3">Các khung giờ tăng ca:</p>
                  <div className="space-y-2">
                    {overtimeDetail.timeSlots.map((slot, index) => {
                      // Tính số giờ cho từng khung giờ
                      const calculateHours = (start: string, end: string): number => {
                        const [startHour, startMinute] = start.split(':').map(Number);
                        const [endHour, endMinute] = end.split(':').map(Number);
                        const startMinutes = startHour * 60 + startMinute;
                        let endMinutes = endHour * 60 + endMinute;
                        if (endMinutes < startMinutes) {
                          endMinutes += 24 * 60; // Ca qua đêm
                        }
                        return Number(((endMinutes - startMinutes) / 60).toFixed(2));
                      };
                      const slotHours = calculateHours(slot.startTime, slot.endTime);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-amber-700">Khung {index + 1}:</span>
                            <span className="font-medium text-gray-900">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">{slotHours} giờ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-amber-300">
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="font-medium text-gray-900">{overtimeDetail.startTime} - {overtimeDetail.endTime}</p>
                </div>
              )}
            </div>

            {/* Approver Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin phê duyệt</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Người được giao duyệt</p>
                  {overtimeDetail.approvers && overtimeDetail.approvers.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {overtimeDetail.approvers.map((approver) => (
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
                      {overtimeDetail.approver?.user?.fullName || `#${overtimeDetail.approverEmployeeId}`}
                    </p>
                  )}
                </div>
                {/* Hiển thị người đã duyệt nếu đơn đã được xử lý */}
                {overtimeDetail.decidedBy && (overtimeDetail.status === 'approved' || overtimeDetail.status === 'rejected') && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {overtimeDetail.status === 'approved' ? 'Người đã duyệt' : 'Người đã từ chối'}
                    </p>
                    <p className={`font-medium ${overtimeDetail.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                      {overtimeDetail.decidedBy.user?.fullName || `#${overtimeDetail.decidedByEmployeeId}`}
                    </p>
                  </div>
                )}
                {overtimeDetail.decidedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Thời gian quyết định</p>
                    <p className="font-medium text-gray-900">
                      {new Date(overtimeDetail.decidedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reason */}
            {overtimeDetail.reason && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Lý do tăng ca</h3>
                <p className="text-gray-700">{overtimeDetail.reason}</p>
              </div>
            )}

            {/* Decision Note */}
            {overtimeDetail.decisionNote && (
              <div className={`border rounded-lg p-4 ${
                overtimeDetail.status === 'approved'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  overtimeDetail.status === 'approved' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {overtimeDetail.status === 'approved' ? 'Ghi chú phê duyệt' : 'Lý do từ chối'}
                </h3>
                <p className={overtimeDetail.status === 'approved' ? 'text-green-700' : 'text-red-700'}>
                  {overtimeDetail.decisionNote}
                </p>
              </div>
            )}

            {/* Request Location */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Vị trí yêu cầu tăng ca</h4>
              </div>
              {requestLoc ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Tọa độ:</span> {requestLoc.lat.toFixed(6)}, {requestLoc.lng.toFixed(6)}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${requestLoc.lat},${requestLoc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <MapPin className="h-4 w-4" />
                    Xem trên bản đồ
                  </a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Không có thông tin vị trí</p>
              )}
            </div>

            {/* Thông tin đơn gốc (nếu đây là đơn bổ sung) */}
            {overtimeDetail.parentOvertimeId && overtimeDetail.parentOvertime && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Đơn tăng ca gốc
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">ID đơn:</span>{' '}
                    <span className="font-medium text-gray-900">#{overtimeDetail.parentOvertime.id}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Tổng giờ:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {overtimeDetail.parentOvertime.totalHours || 0} giờ
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Trạng thái:</span>{' '}
                    <span className={`font-medium ${
                      overtimeDetail.parentOvertime.status === 'approved' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {overtimeDetail.parentOvertime.status === 'approved' ? 'Đã duyệt' : overtimeDetail.parentOvertime.status}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Danh sách đơn bổ sung (nếu đây là đơn gốc) */}
            {!overtimeDetail.parentOvertimeId && overtimeDetail.supplements && overtimeDetail.supplements.length > 0 && (
              <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-600" />
                  Đơn bổ sung ({overtimeDetail.supplements.length})
                </h3>
                <div className="space-y-3">
                  {overtimeDetail.supplements.map((supplement) => (
                    <div key={supplement.id} className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">ID: #{supplement.id}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              supplement.status === 'approved' ? 'bg-green-100 text-green-700' :
                              supplement.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              supplement.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {supplement.status === 'approved' ? 'Đã duyệt' :
                               supplement.status === 'pending' ? 'Chờ duyệt' :
                               supplement.status === 'rejected' ? 'Từ chối' : supplement.status}
                            </span>
                          </div>
                          {supplement.timeSlots && supplement.timeSlots.length > 0 ? (
                            <div className="text-sm text-gray-600">
                              {supplement.timeSlots.map((slot, idx) => (
                                <span key={idx}>
                                  {slot.startTime} - {slot.endTime}
                                  {idx < supplement.timeSlots!.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {supplement.startTime} - {supplement.endTime}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 mt-1">
                            Tổng: <span className="font-medium">{supplement.totalHours || 0} giờ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin hệ thống</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {overtimeDetail.createdAt && (
                  <div>
                    <p className="text-gray-600">Ngày tạo đơn</p>
                    <p className="font-medium text-gray-900">
                      {new Date(overtimeDetail.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
                {overtimeDetail.updatedAt && (
                  <div>
                    <p className="text-gray-600">Cập nhật lần cuối</p>
                    <p className="font-medium text-gray-900">
                      {new Date(overtimeDetail.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            {/* Button tạo đơn bổ sung - chỉ hiển thị nếu đơn đã được duyệt và không phải đơn bổ sung */}
            {overtimeDetail.status === 'approved' && !overtimeDetail.parentOvertimeId && (
              <button
                onClick={() => setShowCreateSupplementModal(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tạo đơn bổ sung
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Modal tạo đơn bổ sung */}
      {overtimeDetail && (
        <CreateOvertimeModal
          open={showCreateSupplementModal}
          onClose={() => setShowCreateSupplementModal(false)}
          factoryId={overtimeDetail.factoryId}
          currentEmployeeId={overtimeDetail.employeeId}
          employeesManager={employeesManager}
          employeesNotManager={employeesNotManager}
          coefficients={coefficients}
          onSuccess={handleCreateSupplementSuccess}
          parentOvertimeId={overtimeDetail.id}
          defaultOvertimeDate={overtimeDetail.overtimeDate}
        />
      )}
    </div>
  );
}
