import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Camera, Fingerprint } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LoadingButton } from "../../components/commons/Loading";
import { useLoading } from "../../contexts/LoadingContext";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { TimeInput } from "../../components/ui/time-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { PositionItem, Department } from "../../types";
import type { Team } from "../../types/department";
import { positionApi } from "../../api/positions";
import { departmentApi } from "../../api/departments";
import { teamApi } from "../../api/team";
import { employeeApi } from "../../api/employee";
import { usersApi } from "../../api/users";
import ErrorMessage from "../../components/commons/ErrorMessage";
import { useToast } from "../../contexts/ToastContext";
import type { AttendanceMethod } from "../../types/employee";

interface AttendanceMethodOption {
  id: AttendanceMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

// Helper: Format time "H:M" hoặc "HH:MM" thành "HH:MM:SS"
function formatTimeForBackend(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hours = (h || '0').padStart(2, '0');
  const minutes = (m || '0').padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

const attendanceMethods: AttendanceMethodOption[] = [
  {
    id: 'location',
    label: 'Chấm công theo vị trí',
    description: 'Yêu cầu nhân viên ở trong khu vực nhà máy khi chấm công',
    icon: MapPin,
    available: true,
  },
  {
    id: 'remote',
    label: 'Chấm công từ xa',
    description: 'Cho phép chấm công mà không cần kiểm tra vị trí',
    icon: MapPin,
    available: true,
  },
  {
    id: 'photo',
    label: 'Chấm công bằng hình ảnh',
    description: 'Yêu cầu chụp ảnh khi chấm công',
    icon: Camera,
    available: false,
  },
  {
    id: 'fingerprint',
    label: 'Chấm công bằng vân tay',
    description: 'Sử dụng thiết bị vân tay để chấm công',
    icon: Fingerprint,
    available: false,
  },
];

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    employeeCode: "",
    fullName: "",
    gender: "",
    phone: "",
    email: "",
    departmentId: "",
    positionId: "",
    teamId: "",
    salary: "",
    status: "Chính thức",
    salaryType: "daily",
    startDateJob: "",
    endDateJob: "",
    isManager: false,
    hourStartWork: "",
    hourEndWork: "",
  });
  const [attendanceConfig, setAttendanceConfig] = useState({
    allowedAttendanceMethods: ['location'] as ('location' | 'remote' | 'photo' | 'fingerprint')[],
    requireLocationCheck: true,
    requirePhotoVerification: false,
    requireFingerprintVerification: false,
    allowRemoteAttendance: false,
  });

  const isMethodEnabled = (methodId: AttendanceMethod) => {
    return attendanceConfig.allowedAttendanceMethods.includes(methodId);
  };

  const handleMethodToggle = (methodId: AttendanceMethod, currentValue: boolean) => {
    const currentMethods = attendanceConfig.allowedAttendanceMethods;

    if (currentValue) {
      // Turning off - remove method (but keep at least one method)
      if (currentMethods.length > 1) {
        const newMethods = currentMethods.filter((m) => m !== methodId);
        const newConfig = {
          ...attendanceConfig,
          allowedAttendanceMethods: newMethods,
        };

        // If disabling remote, update related fields
        if (methodId === 'remote') {
          newConfig.allowRemoteAttendance = false;
          newConfig.requireLocationCheck = true;
        }

        setAttendanceConfig(newConfig);
      } else {
        showToast('Phải có ít nhất một phương thức chấm công!', 'error');
      }
    } else {
      // Turning on - add method
      const newConfig = {
        ...attendanceConfig,
        allowedAttendanceMethods: [...currentMethods, methodId],
      };

      // If enabling remote, update related fields
      if (methodId === 'remote') {
        newConfig.allowRemoteAttendance = true;
        newConfig.requireLocationCheck = false;
      }

      setAttendanceConfig(newConfig);
    }
  };
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [positionsByDept, setPositionsByDept] = useState<PositionItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teamsByPosition, setTeamsByPosition] = useState<Team[]>([]);
  const [myFactory, setMyFactory] = useState<any>(null);

  // Load factory info
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const factory = await usersApi.getMyFactory();
        if (isMounted) {
          setMyFactory(factory);
        }
      } catch (error) {
        console.error("Error loading factory:", error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load departments
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!myFactory?.id) return;

      try {
        const deps = await departmentApi.getAll(+myFactory.id);
        if (isMounted) {
          setDepartments(deps || []);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [myFactory]);

  // Load positions when department changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!myFactory?.id || !formData.departmentId) {
        setPositionsByDept([]);
        return;
      }
      try {
        const list = await positionApi.getAll(
          myFactory.id,
          Number(formData.departmentId)
        );
        if (isMounted) setPositionsByDept(list || []);
      } catch (_) {
        if (isMounted) setPositionsByDept([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [myFactory, formData.departmentId]);

  // Load teams when department changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!formData.departmentId) {
        setTeamsByPosition([]);
        return;
      }
      try {
        const list = await teamApi.getByDepartment(Number(formData.departmentId));
        if (isMounted) setTeamsByPosition(list || []);
      } catch (_) {
        if (isMounted) setTeamsByPosition([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [formData.departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.departmentId ||
      !formData.positionId
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (!myFactory?.id) {
      setError("Không tìm thấy thông tin nhà máy");
      return;
    }

    showLoading("Đang tạo nhân viên...");

    try {
      const submitData = {
        factoryId: +myFactory.id,
        employeeCode: formData.employeeCode || undefined,
        fullName: formData.fullName,
        gender: formData.gender || undefined,
        phone: formData.phone,
        email: formData.email || undefined,
        positionId: Number(formData.positionId),
        departmentId: Number(formData.departmentId),
        teamId: formData.teamId ? Number(formData.teamId) : undefined,
        salary: formData.salary ? Number(formData.salary) : undefined,
        status: formData.status || undefined,
        salaryType: formData.salaryType as 'daily' | 'production',
        startDateJob: formData.startDateJob || undefined,
        endDateJob: formData.endDateJob || undefined,
        isManager: formData.isManager,
        hourStartWork: formData.hourStartWork ? formatTimeForBackend(formData.hourStartWork) : undefined,
        hourEndWork: formData.hourEndWork ? formatTimeForBackend(formData.hourEndWork) : undefined,
        allowedAttendanceMethods: attendanceConfig.allowedAttendanceMethods.length > 0
          ? attendanceConfig.allowedAttendanceMethods
          : undefined,
        requireLocationCheck: attendanceConfig.requireLocationCheck,
        requirePhotoVerification: attendanceConfig.requirePhotoVerification,
        requireFingerprintVerification: attendanceConfig.requireFingerprintVerification,
        allowRemoteAttendance: attendanceConfig.allowRemoteAttendance,
      };

      await employeeApi.createEmployeeWithUser(submitData);

      showToast("Tạo nhân viên thành công!", "success");
      navigate("/nha-may-cua-toi/nhan-vien");
    } catch (err: any) {
      const message =
        err?.message || err?.data?.errors?.message || "Tạo nhân viên thất bại";
      setError(
        typeof message === "string" ? message : "Tạo nhân viên thất bại"
      );
    } finally {
      hideLoading();
    }
  };

  const handleCancel = () => {
    navigate("/nha-may-cua-toi/nhan-vien");
  };

  const isFormValid = formData.fullName && formData.phone && formData.positionId;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Thêm nhân viên mới</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {error && <ErrorMessage error={error} setError={setError} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột trái - Thông tin cá nhân */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Thông tin cá nhân</h3>

              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Mã nhân viên</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCode: e.target.value })
                  }
                  placeholder="Nhập mã nhân viên"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Giới tính</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  inputMode="tel"
                  pattern="^[0-9]{9,11}$"
                  title="Nhập 9-11 chữ số"
                  maxLength={11}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Nhập email (không bắt buộc)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startDateJob">Ngày bắt đầu</Label>
                <Input
                  id="startDateJob"
                  type="date"
                  value={formData.startDateJob}
                  onChange={(e) =>
                    setFormData({ ...formData, startDateJob: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cột phải - Thông tin công việc */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Thông tin công việc</h3>

              <div className="grid gap-2">
                <Label>
                  Phòng ban <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      departmentId: value,
                      positionId: "",
                      teamId: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>
                  Vị trí <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.positionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, positionId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionsByDept.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tổ</Label>
                <Select
                  value={formData.teamId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teamId: value })
                  }
                  disabled={!formData.departmentId || teamsByPosition.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.departmentId
                        ? "Chọn phòng ban trước"
                        : teamsByPosition.length === 0
                        ? "Không có tổ nào"
                        : "Chọn tổ"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsByPosition.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Đã phỏng vấn">Đã phỏng vấn</SelectItem>
                    <SelectItem value="Thử việc">Thử việc</SelectItem>
                    <SelectItem value="Chính thức">Chính thức</SelectItem>
                    <SelectItem value="Nghỉ việc">Nghỉ việc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Loại lương</Label>
                <Select
                  value={formData.salaryType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, salaryType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại lương" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Theo ngày công</SelectItem>
                    <SelectItem value="production">Theo sản lượng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="salary">
                  Lương {formData.salaryType === 'daily' ? 'theo ngày' : 'theo sản lượng'} (VNĐ)
                </Label>
                <Input
                  id="salary"
                  type="number"
                  min={0}
                  step="1000"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder={formData.salaryType === 'daily' ? 'Nhập lương theo ngày' : 'Nhập lương theo sản lượng'}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={formData.isManager}
                  onChange={(e) =>
                    setFormData({ ...formData, isManager: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isManager" className="text-sm font-medium">
                  Quản lý
                </Label>
              </div>
            </div>
          </div>

          {/* Giờ làm việc riêng */}
          <div className="mt-6 pt-6 border-t">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Giờ làm việc riêng (tùy chọn)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Nếu nhân viên có giờ làm việc khác với nhà máy, hãy thiết lập tại đây. Để trống sẽ áp dụng giờ của nhà máy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="hourStartWork">Giờ bắt đầu làm việc</Label>
                <TimeInput
                  value={formData.hourStartWork}
                  onChange={(value) =>
                    setFormData({ ...formData, hourStartWork: value })
                  }
                  placeholder="Giờ : Phút"
                />
                <p className="text-xs text-gray-500">
                  VD: 08:00 (để trống nếu dùng giờ nhà máy)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hourEndWork">Giờ kết thúc làm việc</Label>
                <TimeInput
                  value={formData.hourEndWork}
                  onChange={(value) =>
                    setFormData({ ...formData, hourEndWork: value })
                  }
                  placeholder="Giờ : Phút"
                />
                <p className="text-xs text-gray-500">
                  VD: 17:00 (để trống nếu dùng giờ nhà máy)
                </p>
              </div>
            </div>
          </div>

          {/* Cấu hình chấm công */}
          <div className="mt-6 pt-6 border-t">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Phương thức chấm công
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Chọn phương thức chấm công cho phép cho nhân viên này
              </p>
            </div>

            <div className="space-y-4">
              {attendanceMethods.map((method) => {
                const Icon = method.icon;
                const isEnabled = isMethodEnabled(method.id);
                const isDisabled = !method.available;

                return (
                  <div
                    key={method.id}
                    className={`
                      flex items-center justify-between p-4 border border-gray-200 rounded-lg
                      ${!method.available ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`
                        p-2 rounded-lg
                        ${isEnabled ? 'bg-indigo-100' : 'bg-gray-100'}
                      `}>
                        <Icon className={`h-5 w-5 ${isEnabled ? 'text-indigo-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {method.label}
                          {!method.available && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                              Sắp ra mắt
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleMethodToggle(method.id, isEnabled)}
                        disabled={isDisabled}
                        className="sr-only peer"
                      />
                      <div className={`
                        w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                        peer-focus:ring-indigo-300 rounded-full peer
                        peer-checked:after:translate-x-full peer-checked:after:border-white
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:border-gray-300 after:border after:rounded-full
                        after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}></div>
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Phải có ít nhất một phương thức chấm công được bật.
                Cấu hình này sẽ áp dụng cho tất cả các lần chấm công của nhân viên.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="gap-2"
            >
              {isLoading ? (
                <LoadingButton text="Đang tạo..." />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Tạo nhân viên
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
