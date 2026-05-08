import { useState, useEffect, useRef } from "react";
import { Edit2, Save, X, Camera } from "lucide-react";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import { positionApi } from "../../api/positions";
import { teamApi } from "../../api/team";
import type { Department, Team } from "../../types/department";
import type { EmployeeWithDetails, PositionItem } from "../../types";
import { useToast } from "../../contexts/ToastContext";
import { TimeInput } from "../ui/time-input";

// Helper: Format time "H:M" hoặc "HH:MM" thành "HH:MM:SS"
function formatTimeForBackend(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hours = (h || "0").padStart(2, "0");
  const minutes = (m || "0").padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

interface EmployeeBasicInfoProps {
  employee: EmployeeWithDetails;
  onUpdate: (updatedEmployee: EmployeeWithDetails) => void;
}

const EmployeeBasicInfo = ({ employee, onUpdate }: EmployeeBasicInfoProps) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [allPositions, setAllPositions] = useState<PositionItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    employeeCode: (employee as any).employeeCode || "",
    gender: (employee as any).gender || "",
    phone: employee.user?.phone || "",
    email: employee.user?.email || "",
    departmentId: employee.department?.id?.toString() || "",
    positionId: employee.positionId.toString(),
    teamId: (employee as any).teamId?.toString() || "",
    salary: employee.salary?.toString() || "",
    status: employee.status || "",
    salaryType: employee.salaryType || "daily",
    startDateJob: employee.startDateJob
      ? new Date(employee.startDateJob).toISOString().split("T")[0]
      : "",
    endDateJob: employee.endDateJob
      ? new Date(employee.endDateJob).toISOString().split("T")[0]
      : "",
    isManager: employee.isManager || false,
    hourStartWork: (employee as any).hourStartWork
      ? (employee as any).hourStartWork.substring(0, 5)
      : "",
    hourEndWork: (employee as any).hourEndWork
      ? (employee as any).hourEndWork.substring(0, 5)
      : "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, posData] = await Promise.all([
          departmentApi.getAll(employee.factoryId),
          positionApi.getAll(employee.factoryId), // Load ALL positions of the factory
        ]);
        setDepartments(deptData);
        setAllPositions(posData);

        // Filter positions by selected department (handle both string and number)
        const filteredPositions = posData.filter(
          (p) => String(p.departmentId) === String(formData.departmentId),
        );
        setPositions(filteredPositions);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  useEffect(() => {
    // Update positions when department changes (handle both string and number)
    if (formData.departmentId) {
      const filteredPositions = allPositions.filter(
        (p) => String(p.departmentId) === String(formData.departmentId),
      );
      setPositions(filteredPositions);
    } else {
      setPositions([]);
    }
  }, [formData.departmentId, allPositions]);

  // Load teams when department changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!formData.departmentId) {
        setTeams([]);
        return;
      }
      try {
        const list = await teamApi.getByDepartment(
          Number(formData.departmentId),
        );
        if (isMounted) setTeams(list || []);
      } catch (_) {
        if (isMounted) setTeams([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [formData.departmentId]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original employee data
    setFormData({
      employeeCode: (employee as any).employeeCode || "",
      gender: (employee as any).gender || "",
      phone: employee.user?.phone || "",
      email: employee.user?.email || "",
      departmentId: employee.department?.id?.toString() || "",
      positionId: employee.positionId.toString(),
      teamId: (employee as any).teamId?.toString() || "",
      salary: employee.salary?.toString() || "",
      status: employee.status || "",
      salaryType: employee.salaryType || "daily",
      startDateJob: employee.startDateJob
        ? new Date(employee.startDateJob).toISOString().split("T")[0]
        : "",
      endDateJob: employee.endDateJob
        ? new Date(employee.endDateJob).toISOString().split("T")[0]
        : "",
      isManager: employee.isManager || false,
      hourStartWork: (employee as any).hourStartWork
        ? (employee as any).hourStartWork.substring(0, 5)
        : "",
      hourEndWork: (employee as any).hourEndWork
        ? (employee as any).hourEndWork.substring(0, 5)
        : "",
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.phone) {
      showToast("Vui lòng nhập số điện thoại", "error");
      return;
    }
    if (!formData.departmentId) {
      showToast("Vui lòng chọn phòng ban", "error");
      return;
    }
    if (!formData.positionId) {
      showToast("Vui lòng chọn vị trí", "error");
      return;
    }

    try {
      setLoading(true);

      // Only send fields that changed
      const payload: any = {
        departmentId: Number(formData.departmentId),
        positionId: Number(formData.positionId),
        teamId: formData.teamId ? Number(formData.teamId) : null,
        salary: formData.salary ? Number(formData.salary) : undefined,
        status: formData.status || undefined,
        salaryType: formData.salaryType as "daily" | "production",
        startDateJob: formData.startDateJob || undefined,
        endDateJob: formData.endDateJob || undefined,
        isManager: formData.isManager,
        hourStartWork: formData.hourStartWork
          ? formatTimeForBackend(formData.hourStartWork)
          : null,
        hourEndWork: formData.hourEndWork
          ? formatTimeForBackend(formData.hourEndWork)
          : null,
      };

      // Only include employeeCode if it changed
      if (formData.employeeCode !== ((employee as any).employeeCode || "")) {
        payload.employeeCode = formData.employeeCode || undefined;
      }

      // Only include gender if it changed
      if (formData.gender !== ((employee as any).gender || "")) {
        payload.gender = formData.gender || undefined;
      }

      // Only include phone if it changed
      if (formData.phone !== (employee.user?.phone || "")) {
        payload.phone = formData.phone;
      }

      // Only include email if it changed
      if (formData.email !== (employee.user?.email || "")) {
        payload.email = formData.email || undefined;
      }

      const updatedEmployee = await employeeApi.updateEmployee(
        employee.id,
        payload,
      );
      onUpdate(updatedEmployee);
      setIsEditing(false);
      showToast("Cập nhật thông tin thành công!", "success");
    } catch (error: any) {
      console.error("Error updating employee:", error);
      const errorMessage =
        error?.response?.data?.errors?.message ||
        error?.message ||
        "Có lỗi xảy ra khi cập nhật thông tin";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      // If department changes, reset position and team
      if (name === "departmentId") {
        setFormData({ ...formData, [name]: value, positionId: "", teamId: "" });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif)$/)) {
      showToast("Vui lòng chọn file ảnh (JPG, PNG, GIF)", "error");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước ảnh không được vượt quá 5MB", "error");
      return;
    }

    try {
      setUploadingAvatar(true);
      const updatedEmployee = await employeeApi.uploadAvatar(employee.id, file);
      onUpdate(updatedEmployee);
      showToast("Cập nhật avatar thành công!", "success");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      const errorMessage =
        error?.response?.data?.errors?.message ||
        error?.message ||
        "Có lỗi xảy ra khi upload avatar";
      showToast(errorMessage, "error");
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Thông tin cơ bản
        </h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            <span>Chỉnh sửa</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Hủy</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Đang lưu..." : "Lưu"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Avatar Section */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300">
              {(employee.user as any).photo?.path ? (
                <img
                  src={(employee.user as any).photo.path}
                  alt={employee.user?.fullName || "-"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-4xl font-semibold">
                  {employee.user?.fullName?.charAt(0).toUpperCase() || "-"}
                </div>
              )}
            </div>

            {/* Upload button overlay */}
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              {uploadingAvatar ? (
                <div className="text-white text-sm">Đang tải...</div>
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Thông tin cá nhân
            </h3>

            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã nhân viên
              </label>
              <input
                type="text"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nhập mã nhân viên"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              />
            </div>

            {/* Full Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={employee.user?.fullName || "-"}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu làm việc
              </label>
              <input
                type="date"
                name="startDateJob"
                value={formData.startDateJob}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc làm việc
              </label>
              <input
                type="date"
                name="endDateJob"
                value={formData.endDateJob}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              />
            </div>

            {/* Working Hours Section */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Giờ làm việc riêng
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Để trống sẽ áp dụng giờ của nhà máy
              </p>

              {/* Hour Start Work */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ bắt đầu
                </label>
                <TimeInput
                  value={formData.hourStartWork}
                  onChange={(value) =>
                    setFormData({ ...formData, hourStartWork: value })
                  }
                  disabled={!isEditing}
                  placeholder="Giờ : Phút"
                />
              </div>

              {/* Hour End Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ kết thúc
                </label>
                <TimeInput
                  value={formData.hourEndWork}
                  onChange={(value) =>
                    setFormData({ ...formData, hourEndWork: value })
                  }
                  disabled={!isEditing}
                  placeholder="Giờ : Phút"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Thông tin công việc
            </h3>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban <span className="text-red-500">*</span>
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vị trí <span className="text-red-500">*</span>
              </label>
              <select
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                disabled={!isEditing || positions.length === 0}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing && positions.length > 0
                    ? "bg-white"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                <option value="">
                  {positions.length === 0
                    ? "Không có vị trí trong phòng ban này"
                    : "Chọn vị trí"}
                </option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
              {isEditing && positions.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  Vui lòng thêm vị trí cho phòng ban này trước khi chọn
                </p>
              )}
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tổ
              </label>
              <select
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                disabled={
                  !isEditing || !formData.departmentId || teams.length === 0
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing && formData.departmentId && teams.length > 0
                    ? "bg-white"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                <option value="">
                  {!formData.departmentId
                    ? "Chọn phòng ban trước"
                    : teams.length === 0
                      ? "Không có tổ nào"
                      : "Chọn tổ"}
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              >
                <option value="">Chọn trạng thái</option>
                <option value="Cộng tác">Cộng tác</option>
                <option value="Thử việc">Thử việc</option>
                <option value="Chính thức">Chính thức</option>
                <option value="Nghỉ việc">Nghỉ việc</option>
              </select>
            </div>

            {/* Salary Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại lương
              </label>
              <select
                name="salaryType"
                value={formData.salaryType}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              >
                <option value="daily">Theo ngày</option>
                <option value="production">Theo sản phẩm</option>
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lương (VNĐ)
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nhập mức lương"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "bg-white" : "bg-gray-50 text-gray-600"
                }`}
              />
            </div>

            {/* Is Manager */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isManager"
                id="isManager"
                checked={formData.isManager}
                onChange={handleChange}
                disabled={!isEditing}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isManager"
                className="ml-2 block text-sm text-gray-700"
              >
                Là quản lý
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeBasicInfo;
