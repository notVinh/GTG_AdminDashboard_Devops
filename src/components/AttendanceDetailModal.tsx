import { useMemo, useState } from 'react';
import { X, MapPin, Clock, Calendar, User, Briefcase, Building2, Image as ImageIcon, Edit2, Save, XCircle, AlertCircle } from 'lucide-react';
import type { EmployeeWithDetails } from '../types';
import { attendanceApi } from '../api/attendance';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeWithDetails;
  date: Date;
  holidayName?: string;
  record: {
    id?: number;
    checkIn?: string;
    checkOut?: string;
    checkInLocation?: { latitude: number; longitude: number } | any;
    checkOutLocation?: { latitude: number; longitude: number } | any;
    checkInAddress?: string;
    checkOutAddress?: string;
    checkInPhotoUrl?: string;
    checkOutPhotoUrl?: string;
    lateMinutes?: number;
    earlyLeaveMinutes?: number;
    overtimeMinutes?: number;
    overtimeNote?: string;
    status: string;
  } | null;
  onSave?: () => void;
}

export default function AttendanceDetailModal({
  isOpen,
  onClose,
  employee,
  date,
  holidayName,
  record,
  onSave
}: AttendanceDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    overtimeHours: 0
  });

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMinutes = (minutes?: number) => {
    if (!minutes || minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours} giờ ${mins} phút`;
    if (hours > 0) return `${hours} giờ`;
    return `${mins} phút`;
  };

  const handleEditClick = () => {
    if (!record) return;

    // Initialize form data with current values
    const checkInTime = record.checkIn ? convertToInputTime(record.checkIn) : '';
    const checkOutTime = record.checkOut ? convertToInputTime(record.checkOut) : '';
    const overtimeHours = record.overtimeMinutes ? record.overtimeMinutes / 60 : 0;

    setFormData({
      checkInTime,
      checkOutTime,
      overtimeHours
    });
    setIsEditMode(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!record?.id) {
      setError('Không tìm thấy thông tin chấm công để cập nhật');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Convert time inputs to ISO format
      const dateStr = formatDateLocal(date);
      const checkInISO = formData.checkInTime ? `${dateStr}T${formData.checkInTime}:00` : undefined;
      const checkOutISO = formData.checkOutTime ? `${dateStr}T${formData.checkOutTime}:00` : undefined;

      await attendanceApi.updateAttendance(record.id, {
        checkInTime: checkInISO,
        checkOutTime: checkOutISO,
        overtimeHours: formData.overtimeHours
      });

      setIsEditMode(false);
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật chấm công');
    } finally {
      setIsSaving(false);
    }
  };

  const convertToInputTime = (timeStr: string): string => {
    // Convert "HH:mm" to "HH:mm" format for input[type="time"]
    return timeStr;
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStatusBadge = () => {
    if (!record || record.status === 'off') {
      return <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">Ngày không làm việc</span>;
    }
    if (!record.checkIn) {
      return <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">Vắng mặt</span>;
    }
    if (record.lateMinutes && record.lateMinutes > 0) {
      return <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">Đi làm muộn/về sớm</span>;
    }
    return <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">Đúng giờ</span>;
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

  const checkInLoc = getLocation(record?.checkInLocation);
  const checkOutLoc = getLocation(record?.checkOutLocation);

  // Marker icons
  const checkInIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html:
          '<div style="width:14px;height:14px;border-radius:9999px;background:#e11d48;border:2px solid #fff;box-shadow:0 0 0 1px #e11d48;"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    []
  );

  const defaultMarker = useMemo(
    () =>
      L.divIcon({
        className: '',
        html:
          '<div style="width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 1px #2563eb;"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    []
  );

  const points = useMemo(() => {
    const arr: Array<{ lat: number; lng: number; type: 'in' | 'out' }> = [];
    if (checkInLoc) arr.push({ lat: checkInLoc.lat, lng: checkInLoc.lng, type: 'in' });
    if (checkOutLoc) arr.push({ lat: checkOutLoc.lat, lng: checkOutLoc.lng, type: 'out' });
    return arr;
  }, [checkInLoc, checkOutLoc]);

  const MapBounds = ({ pts }: { pts: Array<{ lat: number; lng: number }> }) => {
    const map = useMap();
    useMemo(() => {
      if (!pts.length) return;
      if (pts.length === 1) {
        map.setView([pts[0].lat, pts[0].lng], 15);
        return;
      }
      const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }, [map, pts]);
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chi tiết chấm công</h2>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(date)}
              {holidayName ? (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                  Nghỉ lễ: {holidayName}
                </span>
              ) : null}
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
                <h3 className="font-semibold text-gray-900 text-lg">{employee.user?.fullName || '-'}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span>{employee.position?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{(employee as any).department?.name || '—'}</span>
                  </div>
                  {employee.isManager && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Quản lý
                    </span>
                  )}
                </div>
              </div>
              <div>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Attendance Status */}
          {!record || record.status === 'off' ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg">Ngày không làm việc</p>
            </div>
          ) : !record.checkIn ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg">Nhân viên không chấm công trong ngày này</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Check In/Out Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check In */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Giờ vào</h4>
                  </div>
                  {isEditMode ? (
                    <input
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                    />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-700 mb-2">
                        {record.checkIn || '-:-'}
                      </div>
                      {record.lateMinutes && record.lateMinutes > 0 && (
                        <div className="text-sm text-orange-600 font-medium">
                          Muộn: {formatMinutes(record.lateMinutes)}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Check Out */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Giờ ra</h4>
                  </div>
                  {isEditMode ? (
                    <input
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-blue-700 mb-2">
                        {record.checkOut || '-:-'}
                      </div>
                      {record.earlyLeaveMinutes && record.earlyLeaveMinutes > 0 && (
                        <div className="text-sm text-orange-600 font-medium">
                          Về sớm: {formatMinutes(record.earlyLeaveMinutes)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Overtime Hours */}
              {(record.overtimeMinutes && record.overtimeMinutes > 0) || isEditMode ? (
                <div className="border border-yellow-300 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-amber-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-yellow-700" />
                    <h4 className="font-semibold text-yellow-900">Giờ tăng ca</h4>
                  </div>
                  {isEditMode ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.overtimeHours}
                        onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg font-semibold"
                      />
                      <div className="text-sm text-yellow-700">
                        Nhập số giờ tăng ca (ví dụ: 2 hoặc 2.5)
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-yellow-700 mb-2">
                        {formatMinutes(record.overtimeMinutes)}
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {/* Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check In Location */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-rose-600" />
                      <h4 className="font-semibold text-gray-900">Vị trí vào</h4>
                    </div>
                  </div>
                  {checkInLoc ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Tọa độ:</span> {checkInLoc.lat.toFixed(6)}, {checkInLoc.lng.toFixed(6)}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${checkInLoc.lat},${checkInLoc.lng}`}
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

                {/* Check Out Location */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-600" />
                      <h4 className="font-semibold text-gray-900">Vị trí ra</h4>
                    </div>
                  </div>
                  {checkOutLoc ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Tọa độ:</span> {checkOutLoc.lat.toFixed(6)}, {checkOutLoc.lng.toFixed(6)}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${checkOutLoc.lat},${checkOutLoc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <MapPin className="h-4 w-4" />
                        Xem trên bản đồ
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa chấm công ra</p>
                  )}
                </div>
              </div>

              {/* Mini map OpenStreetMap */}
              {points.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Bản đồ (OpenStreetMap)</h4>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    <MapContainer
                      center={[points[0].lat, points[0].lng]}
                      zoom={15}
                      style={{ width: '100%', height: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {points.map((p, idx) => (
                        <Marker
                          key={idx}
                          position={[p.lat, p.lng]}
                          icon={p.type === 'in' ? checkInIcon : defaultMarker}
                        >
                          <span className="sr-only">{p.type}</span>
                        </Marker>
                      ))}
                      <MapBounds pts={points} />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* {(record.checkInPhotoUrl || record.checkOutPhotoUrl) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Ảnh chấm công</h4>
                  </div>
                  <div className="text-sm space-y-2">
                    {record.checkInPhotoUrl && (
                      <a
                        href={record.checkInPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Xem ảnh vào
                      </a>
                    )}
                    {record.checkOutPhotoUrl && (
                      <a
                        href={record.checkOutPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:text-blue-700 underline"
                      >
                        Xem ảnh ra
                      </a>
                    )}
                  </div>
                </div>
              )} */}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            {!isEditMode && record && record.checkIn && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
                Sửa giờ
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
