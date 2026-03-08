import { MapPin } from "lucide-react";
import type { Overtime } from "../types";

interface OvertimeDetailContentProps {
  item: Overtime;
  overtimeRateLabel: (rate: number) => string;
}

export default function OvertimeDetailContent({
  item,
  overtimeRateLabel,
}: OvertimeDetailContentProps) {
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

  const requestLoc = getLocation(item.requestLocation);

  return (
    <>
      {/* Thông tin nhân viên */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Thông tin nhân viên</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-600">Nhân viên</p>
            <p className="font-medium">{item.employee?.user?.fullName || `#${item.employeeId}`}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Người được giao duyệt</p>
            {item.approvers && item.approvers.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.approvers.map((approver) => (
                  <span
                    key={approver.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-sm bg-blue-100 text-blue-800"
                  >
                    {approver.user?.fullName || `#${approver.id}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-medium">{item.approver?.user?.fullName || `#${item.approverEmployeeId}`}</p>
            )}
          </div>
        </div>
        {/* Hiển thị người thực sự duyệt nếu đơn đã được xử lý */}
        {item.decidedBy && (item.status === 'approved' || item.status === 'rejected') && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-gray-600">
              {item.status === 'approved' ? 'Người đã duyệt' : 'Người đã từ chối'}
            </p>
            <p className="font-medium text-green-700">
              {item.decidedBy.user?.fullName || `#${item.decidedByEmployeeId}`}
            </p>
          </div>
        )}
      </div>

      {/* Thông tin ca làm */}
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3">Thông tin ca làm thêm</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-600">Ngày tăng ca</p>
            <p className="font-medium">{new Date(item.overtimeDate).toLocaleDateString('vi-VN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tổng số giờ</p>
            <p className="font-medium text-lg text-amber-700">{item.totalHours || 0} giờ</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Hệ số làm thêm</p>
            {item.coefficientName ? (
              <div>
                <p className="font-medium">{item.coefficientName}</p>
                <p className="text-sm text-gray-500">{item.overtimeRate}x</p>
              </div>
            ) : (
              <p className="font-medium">{overtimeRateLabel(item.overtimeRate)}</p>
            )}
          </div>
        </div>
        
        {/* Hiển thị nhiều khung giờ nếu có */}
        {item.timeSlots && item.timeSlots.length > 1 ? (
          <div className="mt-4 pt-4 border-t border-amber-300">
            <p className="text-sm text-gray-600 mb-3">Các khung giờ tăng ca:</p>
            <div className="space-y-2">
              {item.timeSlots.map((slot, index) => {
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
            <p className="font-medium">{item.startTime} - {item.endTime}</p>
          </div>
        )}
      </div>

      {/* Lý do */}
      {item.reason && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Lý do tăng ca</h3>
          <p className="text-gray-700">{item.reason}</p>
        </div>
      )}

      {/* Vị trí yêu cầu */}
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
    </>
  );
}
