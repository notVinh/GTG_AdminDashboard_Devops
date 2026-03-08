import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users';
import { factoryApi } from '../../api/factory';
import type { BranchLocation } from '../../api/factory';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import MapPicker from '../MapPicker';
import { MapPin, Save, Map, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface LocationConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
}

export default function LocationSettings() {
  const { showToast } = useToast();
  const [myFactory, setMyFactory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [config, setConfig] = useState<LocationConfig>({
    latitude: 0,
    longitude: 0,
    radiusMeters: 200,
    address: '',
  });
  const [branchLocations, setBranchLocations] = useState<BranchLocation[]>([]);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [showBranchMapPicker, setShowBranchMapPicker] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const factory = await usersApi.getMyFactory();
        if (isMounted && factory) {
          setMyFactory(factory);

          // Load existing config from factory
          const lat = factory.location?.latitude || factory.location?.y || 0;
          const lng = factory.location?.longitude || factory.location?.x || 0;

          setConfig({
            latitude: lat,
            longitude: lng,
            radiusMeters: factory.radiusMeters || 200,
            address: factory.address || '',
          });

          // Load branch locations
          if (factory.branchLocations && Array.isArray(factory.branchLocations)) {
            setBranchLocations(factory.branchLocations);
          } else {
            setBranchLocations([]);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!myFactory?.id) return;

    if (config.latitude === 0 || config.longitude === 0) {
      showToast('Vui lòng nhập tọa độ hợp lệ', 'error');
      return;
    }

    if (config.radiusMeters < 50 || config.radiusMeters > 5000) {
      showToast('Bán kính phải từ 50m đến 5000m', 'error');
      return;
    }

    // Validate branch locations
    for (const branch of branchLocations) {
      if (!branch.latitude || !branch.longitude) {
        showToast('Vui lòng nhập đầy đủ tọa độ cho tất cả chi nhánh', 'error');
        return;
      }
    }

    try {
      setSaving(true);

      // Call API to update factory
      await factoryApi.update(myFactory.id, {
        location: {
          latitude: config.latitude,
          longitude: config.longitude,
        },
        radiusMeters: config.radiusMeters,
        branchLocations: branchLocations.length > 0 ? branchLocations : undefined,
      });

      showToast('Đã lưu cấu hình thành công!', 'success');
      
      // Reload factory data
      const updatedFactory = await usersApi.getMyFactory();
      if (updatedFactory) {
        setMyFactory(updatedFactory);
        if (updatedFactory.branchLocations && Array.isArray(updatedFactory.branchLocations)) {
          setBranchLocations(updatedFactory.branchLocations);
        }
      }
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Lỗi khi lưu cấu hình', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = () => {
    setBranchLocations([
      ...branchLocations,
      { name: '', latitude: 0, longitude: 0 },
    ]);
    setEditingBranchIndex(branchLocations.length);
  };

  const handleUpdateBranch = (index: number, field: keyof BranchLocation, value: string | number) => {
    setBranchLocations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteBranch = (index: number) => {
    setBranchLocations(branchLocations.filter((_, i) => i !== index));
    if (editingBranchIndex === index) {
      setEditingBranchIndex(null);
    }
  };

  const handleEditBranch = (index: number) => {
    setEditingBranchIndex(editingBranchIndex === index ? null : index);
    setShowBranchMapPicker(null);
  };

  if (loading) return <div className="py-6">Đang tải...</div>;
  if (!myFactory) return <div className="py-6">Không tìm thấy nhà máy</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Cấu hình vị trí và bán kính chấm công</h3>
        <p className="text-sm text-gray-600 mt-1">
          Thiết lập tọa độ nhà máy và bán kính cho phép nhân viên chấm công
        </p>
      </div>

      <div className="space-y-6">
        {/* Address Display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              Địa chỉ nhà máy
            </div>
          </Label>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">{config.address}</p>
          </div>
        </div>

        {/* Location Coordinates */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-900">
            Tọa độ nhà máy
          </Label>
          
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.000001"
              value={config.latitude}
              onChange={(e) => setConfig({ ...config, latitude: parseFloat(e.target.value) || 0 })}
              placeholder="Vĩ độ (Latitude)"
              className="flex-1"
            />
            <Input
              type="number"
              step="0.000001"
              value={config.longitude}
              onChange={(e) => setConfig({ ...config, longitude: parseFloat(e.target.value) || 0 })}
              placeholder="Kinh độ (Longitude)"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => setShowMapPicker(!showMapPicker)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Map className="h-4 w-4" />
              {showMapPicker ? "Ẩn bản đồ" : "Chọn trên bản đồ"}
            </Button>
          </div>

          {showMapPicker && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-2 bg-gray-50 text-sm text-gray-600">
                Map Picker - Click để chọn vị trí
              </div>
              <MapPicker
                latitude={config.latitude || 10.823022}
                longitude={config.longitude || 106.629699}
                onLocationChange={(lat, lng, address) => {
                  setConfig({
                    ...config,
                    latitude: lat,
                    longitude: lng,
                    address: address || config.address,
                  });
                }}
                height="400px"
              />
            </div>
          )}
        </div>

        {/* Radius */}
        <div className="space-y-2">
          <Label htmlFor="radius" className="text-sm font-medium text-gray-900">
            Bán kính cho phép chấm công (mét)
          </Label>
          <Input
            id="radius"
            type="number"
            min="50"
            max="5000"
            step="10"
            value={config.radiusMeters}
            onChange={(e) => setConfig({ ...config, radiusMeters: parseInt(e.target.value) || 200 })}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Nhân viên chỉ có thể chấm công khi ở trong bán kính này tính từ tọa độ nhà máy (tối thiểu 50m, tối đa 5000m)
          </p>
        </div>

        {/* Branch Locations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-900">
              Vị trí các chi nhánh
            </Label>
            <Button
              type="button"
              onClick={handleAddBranch}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm chi nhánh
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Thêm các vị trí chi nhánh để nhân viên có thể chấm công tại bất kỳ chi nhánh nào
          </p>

          {branchLocations.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-dashed">
              Chưa có chi nhánh nào. Nhấn "Thêm chi nhánh" để thêm mới.
            </div>
          ) : (
            <div className="space-y-3">
              {branchLocations.map((branch, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-900">
                      Chi nhánh {index + 1}
                      {branch.name && ` - ${branch.name}`}
                    </h5>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => handleEditBranch(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {editingBranchIndex === index ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Edit2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDeleteBranch(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingBranchIndex === index ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-700">Tên chi nhánh (tùy chọn)</Label>
                        <Input
                          type="text"
                          value={branch.name || ''}
                          onChange={(e) => handleUpdateBranch(index, 'name', e.target.value)}
                          placeholder="VD: Chi nhánh Hà Nội"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-700">Vĩ độ</Label>
                          <Input
                            type="number"
                            step="0.000001"
                            value={branch.latitude || 0}
                            onChange={(e) => handleUpdateBranch(index, 'latitude', parseFloat(e.target.value) || 0)}
                            placeholder="Latitude"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-700">Kinh độ</Label>
                          <Input
                            type="number"
                            step="0.000001"
                            value={branch.longitude || 0}
                            onChange={(e) => handleUpdateBranch(index, 'longitude', parseFloat(e.target.value) || 0)}
                            placeholder="Longitude"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Button
                          type="button"
                          onClick={() => setShowBranchMapPicker(showBranchMapPicker === index ? null : index)}
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Map className="h-4 w-4" />
                          {showBranchMapPicker === index ? 'Ẩn bản đồ' : 'Chọn trên bản đồ'}
                        </Button>
                        {showBranchMapPicker === index && (
                          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                            <MapPicker
                              key={`branch-map-${index}-${branch.latitude}-${branch.longitude}`}
                              latitude={branch.latitude && branch.latitude !== 0 ? branch.latitude : (config.latitude !== 0 ? config.latitude : 10.823022)}
                              longitude={branch.longitude && branch.longitude !== 0 ? branch.longitude : (config.longitude !== 0 ? config.longitude : 106.629699)}
                              onLocationChange={(lat, lng) => {
                                handleUpdateBranch(index, 'latitude', lat);
                                handleUpdateBranch(index, 'longitude', lng);
                              }}
                              height="300px"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Tọa độ:</span>{' '}
                        {branch.latitude !== 0 && branch.longitude !== 0
                          ? `${branch.latitude.toFixed(6)}, ${branch.longitude.toFixed(6)}`
                          : 'Chưa thiết lập'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Tóm tắt cấu hình</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-medium">Tọa độ chính:</span>{' '}
              {config.latitude !== 0 && config.longitude !== 0
                ? `${config.latitude.toFixed(6)}, ${config.longitude.toFixed(6)}`
                : 'Chưa thiết lập'}
            </p>
            <p>
              <span className="font-medium">Bán kính:</span>{' '}
              {config.radiusMeters}m
            </p>
            <p>
              <span className="font-medium">Số chi nhánh:</span>{' '}
              {branchLocations.length}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || config.latitude === 0 || config.longitude === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </div>
    </div>
  );
}
