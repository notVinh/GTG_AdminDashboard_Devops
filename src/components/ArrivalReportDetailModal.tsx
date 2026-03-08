import { useMemo, useState } from 'react';
import { X, MapPin, Clock, User, Briefcase, Building2, FileText, Image } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ArrivalReport } from '../types';
import ImageLightbox from './ImageLightbox.tsx';

// Fix default marker icon for Leaflet in bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ArrivalReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ArrivalReport | null;
}

export default function ArrivalReportDetailModal({
  isOpen,
  onClose,
  report,
}: ArrivalReportDetailModalProps) {
  if (!isOpen || !report) return null;

  const [lightbox, setLightbox] = useState<{ type: 'arrival' | 'departure'; index: number } | null>(null);

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
    if (report.status === 'arrived') {
      return <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">Đã đến</span>;
    }
    if (report.status === 'departed') {
      return <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">Đã về</span>;
    }
    return <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">Chưa đến</span>;
  };

  const formatDuration = (minutes?: number | null) => {
    if (minutes == null) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} phút`;
    if (mins === 0) return `${hrs} giờ`;
    return `${hrs} giờ ${mins} phút`;
  };

  const formatDistance = (meters?: number | null) => {
    if (meters == null) return '—';
    const numMeters = Number(meters);
    if (isNaN(numMeters)) return '—';
    if (numMeters < 1000) return `${numMeters.toFixed(0)} m`;
    return `${(numMeters / 1000).toFixed(2)} km`;
  };

  const redMarkerIcon = useMemo(
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

  const locations = useMemo(() => {
    const points: Array<{ lat: number; lng: number; type: 'arrival' | 'departure' }> = [];
    if (report.arrivalLocation) {
      points.push({
        lat: report.arrivalLocation.latitude,
        lng: report.arrivalLocation.longitude,
        type: 'arrival',
      });
    }
    if (report.departureLocation) {
      points.push({
        lat: report.departureLocation.latitude,
        lng: report.departureLocation.longitude,
        type: 'departure',
      });
    }
    return points;
  }, [report.arrivalLocation, report.departureLocation]);

  const MapBounds = ({ points }: { points: Array<{ lat: number; lng: number }> }) => {
    const map = useMap();
    useMemo(() => {
      if (points.length === 0) return;
      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 15);
        return;
      }
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }, [map, points]);
    return null;
  };

  const openPreview = (type: 'arrival' | 'departure', index: number) => {
    setLightbox({ type, index });
  };

  const closePreview = () => setLightbox(null);

  const stepPreview = (direction: 1 | -1) => {
    setLightbox((current) => {
      if (!current) return current;
      const list = current.type === 'arrival' ? report.photoUrls || [] : report.departurePhotoUrls || [];
      if (list.length === 0) return null;
      const nextIndex = (current.index + direction + list.length) % list.length;
      return { ...current, index: nextIndex };
    });
  };

  const getPhotosByType = (type: 'arrival' | 'departure') =>
    type === 'arrival' ? report.photoUrls || [] : report.departurePhotoUrls || [];

  const currentPreviewUrl = (() => {
    if (!lightbox) return null;
    const list = getPhotosByType(lightbox.type);
    return list[lightbox.index] ?? null;
  })();

  const currentPreviewTotal = lightbox ? getPhotosByType(lightbox.type).length : 0;
  const currentPreviewLabel = lightbox ? (lightbox.type === 'arrival' ? 'Ảnh đến' : 'Ảnh về') : '';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-9999">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chi tiết báo cáo đến nơi công tác</h2>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(report.arrivalDate)}
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
            {/* Company/Location */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Công ty/Địa điểm công tác</h4>
              </div>
              <div className="text-lg font-medium text-gray-900">
                {report.companyName}
              </div>
            </div>

            {/* Paired info blocks */}
            <div className="grid grid-cols-1 gap-4">
              {/* Thời gian đến / Thời gian về */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Thời gian đến</h4>
                  </div>
                  <div className="text-lg font-bold text-green-700">{formatTime(report.arrivalTime)}</div>
                </div>
                <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold text-indigo-900">Thời gian về</h4>
                  </div>
                  <div className="text-lg font-bold text-indigo-700">
                    {report.departureTime ? formatTime(report.departureTime) : 'Chưa báo về'}
                  </div>
                </div>
              </div>

              {/* Vị trí đến / Vị trí về */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-rose-600" />
                      <h4 className="font-semibold text-gray-900">Vị trí đến</h4>
                    </div>
                  </div>
                  {report.arrivalLocation ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Tọa độ:</span>{' '}
                        <span className="font-mono">
                          {report.arrivalLocation.latitude.toFixed(6)}, {report.arrivalLocation.longitude.toFixed(6)}
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${report.arrivalLocation.latitude},${report.arrivalLocation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                      >
                        <MapPin className="h-4 w-4" />
                        Xem trên Google Maps
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">Chưa có vị trí</div>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-600" />
                      <h4 className="font-semibold text-gray-900">Vị trí về</h4>
                    </div>
                  </div>
                  {report.departureLocation ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Tọa độ:</span>{' '}
                        <span className="font-mono">
                          {report.departureLocation.latitude.toFixed(6)}, {report.departureLocation.longitude.toFixed(6)}
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${report.departureLocation.latitude},${report.departureLocation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                      >
                        <MapPin className="h-4 w-4" />
                        Xem trên Google Maps
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">Chưa báo về</div>
                  )}
                </div>
              </div>

              {/* Mini map OpenStreetMap */}
              {locations.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Bản đồ (OpenStreetMap)</h4>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    <MapContainer
                      center={[locations[0].lat, locations[0].lng]}
                      zoom={15}
                      style={{ width: '100%', height: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {locations.map((p, idx) => (
                        <Marker
                          key={idx}
                          position={[p.lat, p.lng]}
                          icon={p.type === 'arrival' ? redMarkerIcon : defaultMarker}
                        >
                          <span className="sr-only">{p.type}</span>
                        </Marker>
                      ))}
                      <MapBounds points={locations} />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Thời gian ở nhà máy / Khoảng cách đến và về */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Thời gian ở nhà máy</h4>
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {formatDuration(report.stayDurationMinutes)}
                  </div>
                </div>
                <div className="border border-sky-200 rounded-lg p-4 bg-sky-50">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-sky-600" />
                    <h4 className="font-semibold text-sky-900">Khoảng cách đến và về</h4>
                  </div>
                  <div className="text-lg font-bold text-sky-700">
                    {formatDistance(report.distanceMeters)}
                  </div>
                </div>
              </div>

              {/* Ảnh xác nhận đến / về */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">
                      Ảnh xác nhận đến {report.photoUrls && report.photoUrls.length > 0 ? `(${report.photoUrls.length})` : ''}
                    </h4>
                  </div>
                  {report.photoUrls && report.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {report.photoUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors relative cursor-zoom-in"
                          onClick={(e) => {
                            e.preventDefault();
                            openPreview('arrival', index);
                          }}
                        >
                          <img
                            src={url}
                            alt={`Ảnh ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
                            Xem trước
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">Không có ảnh</div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">
                      Ảnh xác nhận về {report.departurePhotoUrls && report.departurePhotoUrls.length > 0 ? `(${report.departurePhotoUrls.length})` : ''}
                    </h4>
                  </div>
                  {report.departurePhotoUrls && report.departurePhotoUrls.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {report.departurePhotoUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors relative cursor-zoom-in"
                          onClick={(e) => {
                            e.preventDefault();
                            openPreview('departure', index);
                          }}
                        >
                          <img
                            src={url}
                            alt={`Ảnh báo về ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
                            Xem trước
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">Không có ảnh</div>
                  )}
                </div>
              </div>
            </div>

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

            {/* Checker Info */}
            {report.checker && (
              <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-semibold text-indigo-900">Người kiểm tra</h4>
                </div>
                <div className="text-gray-700">
                  {report.checker.user?.fullName || '—'}
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    {lightbox && currentPreviewUrl && (
      <ImageLightbox
        isOpen
        imageUrl={currentPreviewUrl}
        label={currentPreviewLabel}
        index={lightbox.index}
        total={currentPreviewTotal}
        onClose={closePreview}
        onPrev={() => stepPreview(-1)}
        onNext={() => stepPreview(1)}
      />
    )}
    </div>
  );
}
