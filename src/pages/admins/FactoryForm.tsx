import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Map,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { factoriesApi } from "../../api/factories";
import type { FactoryItem } from "../../types";
import type { BranchLocation } from "../../api/factory";
import MapPicker from "../../components/MapPicker";
import { useLoading } from "../../contexts/LoadingContext";
import ErrorMessage from "../../components/commons/ErrorMessage";

export default function FactoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [factory, setFactory] = useState<FactoryItem | null>(null);
  const { showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 10.823022,
    longitude: 106.629699,
    address: "",
  });
  const [selectedWorkDays, setSelectedWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Default: Monday to Saturday
  const [branchLocations, setBranchLocations] = useState<BranchLocation[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditMode) {
      loadFactory();
    }
  }, [id]);

  // Scroll to top when error occurs
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [error]);

  const loadFactory = async () => {
    try {
      showLoading("Đang tải thông tin nhà máy...");
      const data = await factoriesApi.getFactory(Number(id));
      setFactory(data);
      if (data.location) {
        setSelectedLocation({
          latitude: data.location.latitude ?? 0,
          longitude: data.location.longitude ?? 0,
          address: data.address || "",
        });
      }
      const branches =
        (data.branchLocations && Array.isArray(data.branchLocations)
          ? data.branchLocations
          : Array.isArray((data as any).branchlocations)
          ? (data as any).branchlocations
          : []) as BranchLocation[];
      setBranchLocations(branches);
      if (data.workDays && data.workDays.length > 0) {
        setSelectedWorkDays(data.workDays);
      }
    } catch (err: any) {
      console.error("Error loading factory:", err);
      setError("Không thể tải thông tin nhà máy");
    } finally {
      hideLoading();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate work days
    if (selectedWorkDays.length === 0) {
      setError("Vui lòng chọn ít nhất một ngày làm việc");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const factoryData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || undefined,
      address: formData.get("address"),
      maxEmployees: parseInt(formData.get("maxEmployees") as string),
      hourStartWork: formData.get("hourStartWork"),
      hourEndWork: formData.get("hourEndWork"),
      location: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
      workDays: selectedWorkDays,
      branchLocations:
        branchLocations.length > 0
          ? branchLocations.filter((b) => b.latitude && b.longitude)
          : undefined,
    };

    try {
      showLoading(isEditMode ? "Đang cập nhật nhà máy..." : "Đang tạo nhà máy...");
      if (isEditMode) {
        await factoriesApi.update(Number(id), factoryData);
      } else {
        await factoriesApi.create(factoryData);
      }
      navigate("/quan-ly/nha-may");
    } catch (error: any) {
      console.error("Error saving factory:", error);
      const message =
        error?.message ||
        error?.data?.errors?.message ||
        `Có lỗi xảy ra khi ${isEditMode ? "cập nhật" : "tạo"} nhà máy`;
      setError(message);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/quan-ly/nha-may")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold">
            {isEditMode ? "Chỉnh sửa nhà máy" : "Tạo nhà máy mới"}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div ref={errorRef}>
              <ErrorMessage error={error} setError={setError} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên nhà máy *
              </label>
              <input
                type="text"
                name="name"
                defaultValue={factory?.name || ""}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên nhà máy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại *
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={factory?.phone || ""}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={factory?.email || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập email (không bắt buộc)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ *
            </label>
            <input
              type="text"
              name="address"
              defaultValue={factory?.address || ""}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập địa chỉ nhà máy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số nhân viên tối đa *
              </label>
              <input
                type="number"
                name="maxEmployees"
                defaultValue={factory?.maxEmployees || 100}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu *
              </label>
              <input
                type="time"
                name="hourStartWork"
                defaultValue={factory?.hourStartWork || "08:00"}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc *
              </label>
              <input
                type="time"
                name="hourEndWork"
                defaultValue={factory?.hourEndWork || "17:00"}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày làm việc *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {[
                { value: 0, label: "CN" },
                { value: 1, label: "T2" },
                { value: 2, label: "T3" },
                { value: 3, label: "T4" },
                { value: 4, label: "T5" },
                { value: 5, label: "T6" },
                { value: 6, label: "T7" },
              ].map((day) => (
                <label
                  key={day.value}
                  className={`
                    flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${
                      selectedWorkDays.includes(day.value)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkDays.includes(day.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorkDays([...selectedWorkDays, day.value].sort());
                      } else {
                        setSelectedWorkDays(selectedWorkDays.filter((d) => d !== day.value));
                      }
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
            {selectedWorkDays.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Vui lòng chọn ít nhất một ngày làm việc</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vị trí trên bản đồ *
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  name="latitude"
                  step="any"
                  value={selectedLocation.latitude}
                  onChange={(e) =>
                    setSelectedLocation((prev) => ({
                      ...prev,
                      latitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Vĩ độ"
                />
                <input
                  type="number"
                  name="longitude"
                  step="any"
                  value={selectedLocation.longitude}
                  onChange={(e) =>
                    setSelectedLocation((prev) => ({
                      ...prev,
                      longitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kinh độ"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  {showMapPicker ? "Ẩn bản đồ" : "Chọn trên bản đồ"}
                </button>
              </div>

              {selectedLocation.address && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Địa chỉ:</strong> {selectedLocation.address}
                </div>
              )}

              {showMapPicker && (
                <MapPicker
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  onLocationChange={(lat, lng, address) => {
                    setSelectedLocation({
                      latitude: lat,
                      longitude: lng,
                      address: address || "",
                    });
                  }}
                  height="300px"
                />
              )}
            </div>
          </div>

          {/* Branch locations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Chi nhánh (tùy chọn)</label>
              <button
                type="button"
                onClick={() =>
                  setBranchLocations((prev) => [
                    ...prev,
                    { name: "", latitude: selectedLocation.latitude || 0, longitude: selectedLocation.longitude || 0 },
                  ])
                }
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Thêm chi nhánh
              </button>
            </div>
            {branchLocations.length === 0 ? (
              <div className="text-sm text-gray-500">Chưa có chi nhánh nào</div>
            ) : (
              <div className="space-y-3">
                {branchLocations.map((branch, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-800">Chi nhánh {idx + 1}</div>
                      <button
                        type="button"
                        onClick={() =>
                          setBranchLocations((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Xóa chi nhánh"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tên chi nhánh</label>
                        <input
                          type="text"
                          value={branch.name || ""}
                          onChange={(e) =>
                            setBranchLocations((prev) => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              return updated;
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: Chi nhánh miền Bắc"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Vĩ độ</label>
                        <input
                          type="number"
                          step="any"
                          value={branch.latitude}
                          onChange={(e) =>
                            setBranchLocations((prev) => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], latitude: parseFloat(e.target.value) || 0 };
                              return updated;
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Latitude"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Kinh độ</label>
                        <input
                          type="number"
                          step="any"
                          value={branch.longitude}
                          onChange={(e) =>
                            setBranchLocations((prev) => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], longitude: parseFloat(e.target.value) || 0 };
                              return updated;
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Longitude"
                          required
                        />
                      </div>
                    </div>
            <div>
              <MapPicker
                latitude={branch.latitude || selectedLocation.latitude}
                longitude={branch.longitude || selectedLocation.longitude}
                onLocationChange={(lat, lng) => {
                  setBranchLocations((prev) => {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], latitude: lat, longitude: lng };
                    return updated;
                  });
                }}
                height="250px"
              />
            </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/quan-ly/nha-may")}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isEditMode ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
