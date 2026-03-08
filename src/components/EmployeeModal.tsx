import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { LoadingButton } from "./commons/Loading";
import { useLoading } from "../contexts/LoadingContext";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { TimeInput } from "./ui/time-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import type { PositionItem, Department, EmployeeItem } from "../types";
import type { Team } from "../types/department";
import { positionApi } from "../api/positions";
import { teamApi } from "../api/team";
import ErrorMessage from "./commons/ErrorMessage";

// Helper: Format time "H:M" hoặc "HH:MM" thành "HH:MM:SS"
function formatTimeForBackend(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hours = (h || '0').padStart(2, '0');
  const minutes = (m || '0').padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  employee?: EmployeeItem | null;
  positions: PositionItem[];
  departments: Department[];
  factoryId: number;
  onSubmit: (data: {
    employeeCode?: string;
    fullName?: string;
    gender?: string;
    phone?: string;
    email?: string;
    positionId: number;
    departmentId?: number;
    teamId?: number;
    salary?: number;
    status?: string;
    salaryType?: 'daily' | 'production';
    startDateJob?: string;
    endDateJob?: string;
    isManager?: boolean;
    hourStartWork?: string | null;
    hourEndWork?: string | null;
  }) => Promise<void> | void;
}

export function EmployeeModal({
  isOpen,
  onClose,
  mode,
  employee,
  departments,
  factoryId,
  onSubmit,
}: EmployeeModalProps) {
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
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [positionsByDept, setPositionsByDept] = useState<PositionItem[]>([]);
  const [teamsByPosition, setTeamsByPosition] = useState<Team[]>([]);

  // Load positions when department changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!factoryId || !formData.departmentId) {
        setPositionsByDept([]);
        return;
      }
      try {
        const list = await positionApi.getAll(
          factoryId,
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
  }, [factoryId, formData.departmentId]);

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

  // Initialize form data when employee changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && employee) {
      const deptId = (employee as any).position?.departmentId || (employee as any).department?.id;
      // Convert TIME format (HH:mm:ss) to HTML time input format (HH:mm)
      const startWork = (employee as any).hourStartWork
        ? (employee as any).hourStartWork.substring(0, 5)
        : "";
      const endWork = (employee as any).hourEndWork
        ? (employee as any).hourEndWork.substring(0, 5)
        : "";
      setFormData({
        employeeCode: (employee as any).employeeCode || "",
        fullName: employee.user?.fullName || "",
        gender: (employee as any).gender || "",
        phone: employee.user?.phone || "",
        email: (employee as any).email || "",
        departmentId: String(deptId || ""),
        positionId: String((employee as any).positionId || employee.position?.id || ""),
        teamId: String((employee as any).teamId || ""),
        salary: String(employee.salary || ""),
        status: employee.status || "Chính thức",
        salaryType: (employee as any).salaryType || "daily",
        startDateJob: employee.startDateJob ? new Date(employee.startDateJob).toISOString().split('T')[0] : "",
        endDateJob: employee.endDateJob ? new Date(employee.endDateJob).toISOString().split('T')[0] : "",
        isManager: employee.isManager || false,
        hourStartWork: startWork,
        hourEndWork: endWork,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
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
    }
  }, [mode, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'create') {
      if (
        !formData.fullName ||
        !formData.phone ||
        !formData.departmentId ||
        !formData.positionId
      ) {
        setError("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }
    } else {
      if (!formData.positionId) {
        setError("Vui lòng chọn vị trí");
        return;
      }
    }

    showLoading(mode === 'create' ? "Đang tạo nhân viên..." : "Đang cập nhật nhân viên...");
    
    try {
      const submitData: any = {
        positionId: Number(formData.positionId),
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        teamId: formData.teamId ? Number(formData.teamId) : undefined,
        salary: formData.salary ? Number(formData.salary) : undefined,
        status: formData.status || undefined,
        salaryType: formData.salaryType as 'daily' | 'production',
        startDateJob: formData.startDateJob || undefined,
        endDateJob: formData.endDateJob || undefined,
        isManager: formData.isManager,
        hourStartWork: formData.hourStartWork ? formatTimeForBackend(formData.hourStartWork) : null,
        hourEndWork: formData.hourEndWork ? formatTimeForBackend(formData.hourEndWork) : null,
      };

      if (mode === 'create') {
        submitData.employeeCode = formData.employeeCode || undefined;
        submitData.fullName = formData.fullName;
        submitData.gender = formData.gender || undefined;
        submitData.phone = formData.phone;
        submitData.email = formData.email || undefined;
      } else {
        // For edit mode, only include changed fields
        if (employee) {
          const employeeCodeChanged = formData.employeeCode !== ((employee as any).employeeCode || '');
          const genderChanged = formData.gender !== ((employee as any).gender || '');
          const phoneChanged = formData.phone !== (employee.user?.phone || '');
          const emailChanged = formData.email !== ((employee as any).email || '');

          if (employeeCodeChanged) submitData.employeeCode = formData.employeeCode || undefined;
          if (genderChanged) submitData.gender = formData.gender || undefined;
          if (phoneChanged) submitData.phone = formData.phone || undefined;
          if (emailChanged) submitData.email = formData.email || undefined;
        }
      }

      await onSubmit(submitData);
      
      // Reset form after successful submission
      if (mode === 'create') {
        setFormData({
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
      }
    } catch (err: any) {
      const message =
        err?.message || err?.data?.errors?.message || 
        (mode === 'create' ? "Tạo nhân viên thất bại" : "Cập nhật nhân viên thất bại");
      setError(
        typeof message === "string" ? message : 
        (mode === 'create' ? "Tạo nhân viên thất bại" : "Cập nhật nhân viên thất bại")
      );
    } finally {
      hideLoading();
    }
  };

  const handleClose = () => {
    setFormData({
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
    setError(null);
    onClose();
  };

  const isFormValid = mode === 'create' 
    ? formData.fullName && formData.phone && formData.positionId
    : formData.positionId;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm nhân viên' : 'Cập nhật nhân viên'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage error={error} setError={setError} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Cột trái - Thông tin cá nhân */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Thông tin cá nhân</h3>
              
              {/* Employee Info Display for edit mode */}
              {mode === 'edit' && employee && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Nhân viên</div>
                  <div className="font-medium">{employee.user?.fullName || '-'}</div>
                  <div className="text-sm text-gray-500">{employee.user?.phone || '-'}</div>
                </div>
              )}

              {/* Employee Code */}
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Mã nhân viên</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCode: e.target.value })
                  }
                  placeholder="Nhập mã nhân viên"
                  disabled={mode === 'edit' && !!(employee as any)?.employeeCode}
                />
              </div>

              {mode === 'create' && (
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
              )}

              {/* Gender */}
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
                  Số điện thoại {mode === 'create' && <span className="text-red-500">*</span>}
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
                  required={mode === 'create'}
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

              {mode === 'edit' && (
                <div className="grid gap-2">
                  <Label htmlFor="endDateJob">Ngày kết thúc</Label>
                  <Input
                    id="endDateJob"
                    type="date"
                    value={formData.endDateJob}
                    onChange={(e) =>
                      setFormData({ ...formData, endDateJob: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {/* Cột phải - Thông tin công việc */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Thông tin công việc</h3>
              
              <div className="grid gap-2">
                <Label>
                  Phòng ban {mode === 'create' && <span className="text-red-500">*</span>}
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
          <div className="col-span-2 pt-4 border-t mt-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2 mb-4">
              Giờ làm việc riêng (tùy chọn)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Nếu nhân viên có giờ làm việc khác với nhà máy, hãy thiết lập tại đây. Để trống sẽ áp dụng giờ của nhà máy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hourStartWork">Giờ bắt đầu làm việc</Label>
                <TimeInput
                  value={formData.hourStartWork}
                  onChange={(value) =>
                    setFormData({ ...formData, hourStartWork: value })
                  }
                  placeholder="Giờ : Phút"
                />
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
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <LoadingButton text={mode === 'create' ? "Đang tạo..." : "Đang cập nhật..."} />
              ) : (
                mode === 'create' ? "Tạo nhân viên" : "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeModal;
