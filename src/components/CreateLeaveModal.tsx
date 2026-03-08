import { useState, useEffect } from "react";
import { leaveRequestApi } from "../api/leave-request";
import { leaveTypeApi } from "../api/leave-type";
import type { CreateLeaveRequestDto, UpdateLeaveRequestDto, LeaveRequest, LeaveSession, LeaveTypeConfig } from "../types";
import { Button } from "./ui/button";
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { MultiSelect } from "./ui/multi-select";
import { SelectWithSearch } from "./ui/select-with-search";

interface CreateLeaveModalProps {
  open: boolean;
  onClose: () => void;
  factoryId: number;
  currentEmployeeId: number;
  employeesManager: any[];
  employeesNotManager: any[];
  onSuccess: (created: LeaveRequest) => void;
  editingLeaveRequest?: LeaveRequest | null;
}

export default function CreateLeaveModal({
  open,
  onClose,
  factoryId,
  currentEmployeeId,
  employeesManager,
  employeesNotManager,
  onSuccess,
  editingLeaveRequest,
}: CreateLeaveModalProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [formData, setFormData] = useState<CreateLeaveRequestDto>({
    factoryId: factoryId,
    employeeId: 0,
    approverEmployeeIds: [currentEmployeeId],
    leaveTypeId: undefined,
    leaveSession: "full_day",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load leave types when modal opens
  useEffect(() => {
    if (open && factoryId) {
      leaveTypeApi.getByFactory(factoryId).then(setLeaveTypes).catch(console.error);
    }
  }, [open, factoryId]);

  // Load dữ liệu đơn vào form khi edit
  useEffect(() => {
    if (open && editingLeaveRequest) {
      const startDate = new Date(editingLeaveRequest.startDate).toISOString().split("T")[0];
      const endDate = new Date(editingLeaveRequest.endDate).toISOString().split("T")[0];
      
      setFormData({
        factoryId: editingLeaveRequest.factoryId,
        employeeId: editingLeaveRequest.employeeId,
        approverEmployeeIds: editingLeaveRequest.approverEmployeeIds || [currentEmployeeId],
        leaveTypeId: editingLeaveRequest.leaveTypeId || undefined,
        leaveSession: editingLeaveRequest.leaveSession,
        startDate,
        endDate,
        reason: editingLeaveRequest.reason || "",
      });
    } else if (open && !editingLeaveRequest) {
      // Reset form khi tạo mới
      setFormData({
        factoryId: factoryId,
        employeeId: 0,
        approverEmployeeIds: [currentEmployeeId],
        leaveTypeId: undefined,
        leaveSession: "full_day",
        startDate: "",
        endDate: "",
        reason: "",
      });
    }
  }, [open, editingLeaveRequest, factoryId, currentEmployeeId]);

  const validateCreateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!editingLeaveRequest && !formData.employeeId) {
      errors.employeeId = "Vui lòng chọn nhân viên";
    }
    if (!formData.approverEmployeeIds || formData.approverEmployeeIds.length === 0) {
      errors.approverEmployeeIds = "Vui lòng chọn ít nhất một người duyệt";
    }
    if (!formData.leaveTypeId) {
      errors.leaveTypeId = "Vui lòng chọn loại nghỉ phép";
    }
    if (!formData.startDate) {
      errors.startDate = "Vui lòng chọn ngày bắt đầu";
    }
    if (!formData.endDate) {
      errors.endDate = "Vui lòng chọn ngày kết thúc";
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCreateForm()) return;

    try {
      // Nếu đang edit, gọi API update
      if (editingLeaveRequest?.id) {
        const updateData: UpdateLeaveRequestDto = {
          leaveTypeId: formData.leaveTypeId,
          leaveSession: formData.leaveSession,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          approverEmployeeIds: formData.approverEmployeeIds,
        };
        const updated = await leaveRequestApi.update(editingLeaveRequest.id, updateData);
        onSuccess(updated);
        handleClose();
        return;
      }

      // Nếu đang tạo mới
      const created = await leaveRequestApi.create(formData);
      onSuccess(created);
      handleClose();
    } catch (error) {
      console.error("Error creating/updating leave request:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      factoryId: factoryId,
      employeeId: 0,
      approverEmployeeIds: [currentEmployeeId],
      leaveTypeId: undefined,
      leaveSession: "full_day",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setFormErrors({});
    onClose();
  };

  // Kiểm tra xem có phải nghỉ 1 ngày không
  const isSingleDay = formData.startDate && formData.endDate && formData.startDate === formData.endDate;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLeaveRequest ? "Sửa đơn xin nghỉ phép" : "Tạo đơn xin nghỉ phép"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeId">
                Nhân viên <span className="text-red-500">*</span>
              </Label>
              {editingLeaveRequest ? (
                <Input
                  value={editingLeaveRequest.employee?.user?.fullName || `#${editingLeaveRequest.employeeId}`}
                  disabled
                  className="bg-gray-100"
                />
              ) : (
                <SelectWithSearch
                  value={formData.employeeId > 0 ? formData.employeeId.toString() : undefined}
                  onChange={(v) =>
                    setFormData({ ...formData, employeeId: Number(v) })
                  }
                  placeholder="Chọn nhân viên"
                  options={[...employeesManager, ...employeesNotManager].map((emp: any) => ({
                    value: emp.id.toString(),
                    label: emp.user?.fullName || `#${emp.id}`,
                    extra: emp.isManager ? "(Quản lý)" : undefined,
                  }))}
                />
              )}
              {formErrors.employeeId && (
                <p className="text-sm text-red-500 mt-1">{formErrors.employeeId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="approverEmployeeIds">
                Người duyệt <span className="text-red-500">*</span>
              </Label>
              <MultiSelect
                options={employeesManager.map((emp: any) => ({
                  value: emp.id.toString(),
                  label: emp.user?.fullName || `#${emp.id}`,
                }))}
                value={(formData.approverEmployeeIds || []).map(String)}
                onChange={(values) =>
                  setFormData({ ...formData, approverEmployeeIds: values.map(Number) })
                }
                placeholder="Chọn người duyệt..."
              />
              {formErrors.approverEmployeeIds && (
                <p className="text-sm text-red-500 mt-1">{formErrors.approverEmployeeIds}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
              {formErrors.startDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
              {formErrors.endDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="leaveTypeId">
                Loại nghỉ phép <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.leaveTypeId?.toString() || ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, leaveTypeId: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại nghỉ phép" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id.toString()}>
                      <span className="flex items-center gap-2">
                        {lt.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.leaveTypeId && (
                <p className="text-sm text-red-500 mt-1">{formErrors.leaveTypeId}</p>
              )}
            </div>

            {isSingleDay && (
              <div>
                <Label htmlFor="leaveSession">
                  Buổi nghỉ <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.leaveSession}
                  onValueChange={(v) =>
                    setFormData({ ...formData, leaveSession: v as LeaveSession })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn buổi nghỉ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Cả ngày</SelectItem>
                    <SelectItem value="morning">Buổi sáng</SelectItem>
                    <SelectItem value="afternoon">Buổi chiều</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Lý do nghỉ phép</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Nhập lý do nghỉ phép..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>{editingLeaveRequest ? "Cập nhật" : "Tạo đơn"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
