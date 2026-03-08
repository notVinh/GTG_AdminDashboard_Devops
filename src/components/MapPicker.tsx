import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Search, MapPin as MapPinIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '../contexts/ToastContext';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  height?: string;
  className?: string;
}

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component để handle map events
function MapEventHandler({
  onMapClick
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  height = '400px',
  className = ''
}: MapPickerProps) {
  const { showToast } = useToast();
  const [position, setPosition] = useState<[number, number]>([
    latitude || 21.028511,
    longitude || 105.804817
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const isUserInteractionRef = useRef(false);
  const lastPropsRef = useRef({ latitude, longitude });

  // Reverse Geocoding - Lấy địa chỉ từ tọa độ (dùng Nominatim - OpenStreetMap)
  const reverseGeocode = useCallback(async (lat: number, lng: number, skipCallback = false) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
        if (!skipCallback) {
          onLocationChange(lat, lng, data.display_name);
        }
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        if (!skipCallback) {
          onLocationChange(lat, lng);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (!skipCallback) {
        onLocationChange(lat, lng);
      }
    }
  }, [onLocationChange]);

  // Chỉ update từ props khi không phải user interaction
  useEffect(() => {
    const latChanged = lastPropsRef.current.latitude !== latitude;
    const lngChanged = lastPropsRef.current.longitude !== longitude;
    
    if ((latChanged || lngChanged) && !isUserInteractionRef.current) {
      if (latitude && longitude) {
        const newPosition: [number, number] = [latitude, longitude];
        setPosition(newPosition);
        reverseGeocode(latitude, longitude, true); // Skip callback để tránh loop
      }
    }
    
    lastPropsRef.current = { latitude, longitude };
    isUserInteractionRef.current = false; // Reset flag sau mỗi render
  }, [latitude, longitude, reverseGeocode]);

  // Geocoding - Tìm kiếm địa điểm (dùng Nominatim)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&accept-language=vi&countrycodes=vn&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const formattedAddress = data[0].display_name;

        isUserInteractionRef.current = true;
        setPosition([lat, lng]);
        setAddress(formattedAddress);
        onLocationChange(lat, lng, formattedAddress);
      } else {
        showToast('Không tìm thấy địa điểm. Vui lòng thử lại với từ khóa khác.', 'error');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      showToast('Lỗi khi tìm kiếm địa điểm', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle map click - GỌI NGAY onLocationChange khi click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    isUserInteractionRef.current = true; // Đánh dấu là user interaction
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    // Gọi onLocationChange ngay lập tức để cập nhật state
    onLocationChange(lat, lng);
    // Sau đó reverse geocode để lấy địa chỉ (không chặn)
    reverseGeocode(lat, lng, false);
  }, [onLocationChange, reverseGeocode]);

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Trình duyệt không hỗ trợ định vị', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        isUserInteractionRef.current = true;
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
        reverseGeocode(lat, lng, false);
      },
      (error) => {
        console.error('Error getting location:', error);
        showToast('Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí.', 'error');
      }
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Box */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm kiếm địa điểm (ví dụ: Long Biên, Hà Nội)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? 'Đang tìm...' : 'Tìm'}
          </button>
          <button
            onClick={handleGetCurrentLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Lấy vị trí hiện tại"
          >
            <MapPinIcon className="h-4 w-4" />
            Vị trí của tôi
          </button>
        </div>

        {/* Address Display */}
        {address && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <MapPinIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Địa chỉ đã chọn:</p>
              <p className="text-sm text-blue-700">{address}</p>
            </div>
          </div>
        )}
      </div>

      {/* OpenStreetMap with Leaflet */}
      <div style={{ height }} className="border border-gray-300 rounded-lg overflow-hidden shadow-md">
        <MapContainer
          center={position}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <MapEventHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Current Coordinates Display */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          <span className="font-medium">Tọa độ:</span>{' '}
          <span className="font-mono">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Click vào bản đồ để chọn vị trí
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="font-medium mb-1">Hướng dẫn:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click vào bản đồ để chọn vị trí chính xác</li>
          <li>Sử dụng ô tìm kiếm để tìm địa điểm theo tên</li>
          <li>Nhấn "Vị trí của tôi" để lấy tọa độ hiện tại của bạn</li>
          <li>Kéo/phóng to bản đồ để xem chi tiết hơn</li>
        </ul>
      </div>
    </div>
  );
}
