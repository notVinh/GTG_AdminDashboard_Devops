import { useState, useEffect } from "react";
import { overtimeApi } from "../api/overtime";
import type { CreateOvertimeDto, UpdateOvertimeDto, OvertimeCoefficient, Overtime, TimeSlot } from "../types";
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
import { Plus, Trash2 } from "lucide-react";

interface CreateOvertimeModalProps {
  open: boolean;
  onClose: () => void;
  factoryId: number;
  currentEmployeeId: number;
  employeesManager: any[];
  employeesNotManager: any[];
  coefficients: OvertimeCoefficient[];
  onSuccess: (overtime: Overtime) => void;
  parentOvertimeId?: number; // ID đơn gốc (nếu đây là đơn bổ sung)
  defaultOvertimeDate?: string; // Ngày mặc định (cho đơn bổ sung)
  editingOvertime?: Overtime | null; // Đơn đang được sửa (nếu có)
}

export default function CreateOvertimeModal({
  open,
  onClose,
  factoryId,
  currentEmployeeId,
  employeesManager,
  employeesNotManager,
  coefficients,
  onSuccess,
  parentOvertimeId,
  defaultOvertimeDate,
  editingOvertime,
}: CreateOvertimeModalProps) {
  const [formData, setFormData] = useState<CreateOvertimeDto>({
    factoryId: factoryId,
    employeeId: 0,
    approverEmployeeIds: [currentEmployeeId],
    overtimeCoefficientId: 0,
    overtimeDate: defaultOvertimeDate || "",
    timeSlots: [{ startTime: "", endTime: "" }], // Mặc định 1 khung giờ
    reason: "",
    parentOvertimeId: parentOvertimeId,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load dữ liệu đơn vào form khi edit
  useEffect(() => {
    if (open && editingOvertime) {
      // Format ngày
      const date = new Date(editingOvertime.overtimeDate);
      const formattedDate = date.toISOString().split("T")[0];

      // Lấy timeSlots hoặc tạo từ startTime/endTime
      let timeSlots: TimeSlot[] = [];
      if (editingOvertime.timeSlots && editingOvertime.timeSlots.length > 0) {
        timeSlots = editingOvertime.timeSlots;
      } else if (editingOvertime.startTime && editingOvertime.endTime) {
        timeSlots = [{ startTime: editingOvertime.startTime, endTime: editingOvertime.endTime }];
      } else {
        timeSlots = [{ startTime: "", endTime: "" }];
      }

      // Tìm coefficientId từ coefficientName
      const coefficient = coefficients.find(
        (c) => c.shiftName === editingOvertime.coefficientName
      );

      // Đảm bảo employeeId là number và có giá trị
      const employeeIdValue = editingOvertime.employeeId 
        ? Number(editingOvertime.employeeId) 
        : 0;

      setFormData({
        factoryId: editingOvertime.factoryId,
        employeeId: employeeIdValue,
        approverEmployeeIds: editingOvertime.approverEmployeeIds || [currentEmployeeId],
        overtimeCoefficientId: coefficient?.id || 0,
        overtimeDate: formattedDate,
        timeSlots,
        reason: editingOvertime.reason || "",
        parentOvertimeId: editingOvertime.parentOvertimeId || parentOvertimeId,
      });
    } else if (open && !editingOvertime) {
      // Reset form khi tạo mới
      setFormData({
        factoryId: factoryId,
        employeeId: 0,
        approverEmployeeIds: [currentEmployeeId],
        overtimeCoefficientId: 0,
        overtimeDate: defaultOvertimeDate || "",
        timeSlots: [{ startTime: "", endTime: "" }],
        reason: "",
        parentOvertimeId: parentOvertimeId,
      });
    }
  }, [open, editingOvertime, factoryId, currentEmployeeId, defaultOvertimeDate, parentOvertimeId, coefficients]);

  const validateCreateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Chỉ validate employeeId khi tạo mới, không validate khi edit
    if (!editingOvertime && !formData.employeeId) {
      errors.employeeId = "Vui lòng chọn nhân viên";
    }
    if (!formData.approverEmployeeIds || formData.approverEmployeeIds.length === 0) {
      errors.approverEmployeeIds = "Vui lòng chọn ít nhất một người duyệt";
    }
    if (!formData.overtimeCoefficientId) {
      errors.overtimeCoefficientId = "Vui lòng chọn hệ số làm thêm";
    }
    if (!formData.overtimeDate) {
      errors.overtimeDate = "Vui lòng chọn ngày tăng ca";
    // } else if (!editingOvertime) {
    //   // Chỉ validate ngày không được trong quá khứ khi tạo mới
    //   const selectedDate = new Date(formData.overtimeDate);
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);

    //   if (selectedDate < today) {
    //     errors.overtimeDate = "Ngày tăng ca phải từ hôm nay trở về sau";
    //   }
    }

    // Validate timeSlots
    if (!formData.timeSlots || formData.timeSlots.length === 0) {
      errors.timeSlots = "Phải có ít nhất một khung giờ tăng ca";
    } else if (formData.timeSlots.length > 15) {
      errors.timeSlots = "Tối đa 15 khung giờ tăng ca trong một ngày";
    } else {
      // Validate từng khung giờ
      formData.timeSlots.forEach((slot, index) => {
        if (!slot.startTime) {
          errors[`timeSlot_${index}_startTime`] = "Vui lòng nhập giờ bắt đầu";
        }
        if (!slot.endTime) {
          errors[`timeSlot_${index}_endTime`] = "Vui lòng nhập giờ kết thúc";
        }
        // Validate format HH:mm
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (slot.startTime && !timeRegex.test(slot.startTime)) {
          errors[`timeSlot_${index}_startTime`] = "Định dạng không hợp lệ (VD: 18:00)";
        }
        if (slot.endTime && !timeRegex.test(slot.endTime)) {
          errors[`timeSlot_${index}_endTime`] = "Định dạng không hợp lệ (VD: 22:00)";
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCreateForm()) return;

    try {
      // Nếu đang edit, gọi API update
      if (editingOvertime?.id) {
        // Lọc các khung giờ hợp lệ
        const validTimeSlots = formData.timeSlots?.filter(
          (slot) => slot.startTime && slot.endTime
        ) || [];

        const updateData: UpdateOvertimeDto = {
          overtimeDate: formData.overtimeDate,
          reason: formData.reason,
          overtimeCoefficientId: formData.overtimeCoefficientId,
          approverEmployeeIds: formData.approverEmployeeIds?.length
            ? formData.approverEmployeeIds
            : formData.approverEmployeeId
            ? [formData.approverEmployeeId]
            : undefined,
        };

        // Nếu có nhiều hơn 1 khung giờ → gửi timeSlots
        if (validTimeSlots.length > 1) {
          updateData.timeSlots = validTimeSlots;
        } else if (validTimeSlots.length === 1) {
          // Nếu chỉ có 1 khung giờ → gửi cả timeSlots và startTime/endTime (backward compatible)
          updateData.timeSlots = validTimeSlots;
          updateData.startTime = validTimeSlots[0].startTime;
          updateData.endTime = validTimeSlots[0].endTime;
        }

        const updated = await overtimeApi.update(editingOvertime.id, updateData);
        onSuccess(updated);
        handleClose();
        return;
      }

      // Nếu đang tạo mới
      // Chuẩn bị data để gửi
      const submitData: CreateOvertimeDto = {
        ...formData,
      };

      // Lọc các khung giờ hợp lệ
      const validTimeSlots = formData.timeSlots?.filter(
        (slot) => slot.startTime && slot.endTime
      ) || [];

      // Nếu có nhiều hơn 1 khung giờ → gửi timeSlots
      if (validTimeSlots.length > 1) {
        submitData.timeSlots = validTimeSlots;
        delete submitData.startTime;
        delete submitData.endTime;
      } else if (validTimeSlots.length === 1) {
        // Nếu chỉ có 1 khung giờ → gửi startTime/endTime (backward compatible)
        submitData.startTime = validTimeSlots[0].startTime;
        submitData.endTime = validTimeSlots[0].endTime;
        delete submitData.timeSlots;
      }

      // Nếu có parentOvertimeId, gọi API createSupplement
      let created: Overtime;
      if (parentOvertimeId) {
        created = await overtimeApi.createSupplement(parentOvertimeId, submitData);
      } else {
        created = await overtimeApi.create(submitData);
      }
      
      onSuccess(created);
      handleClose();
    } catch (error) {
      console.error("Error saving overtime:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      factoryId: factoryId,
      employeeId: 0,
      approverEmployeeIds: [currentEmployeeId],
      overtimeCoefficientId: 0,
      overtimeDate: "",
      timeSlots: [{ startTime: "", endTime: "" }],
      reason: "",
    });
    setFormErrors({});
    onClose();
  };

  const addTimeSlot = () => {
    if (formData.timeSlots && formData.timeSlots.length < 15) {
      setFormData({
        ...formData,
        timeSlots: [...(formData.timeSlots || []), { startTime: "", endTime: "" }],
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    if (formData.timeSlots && formData.timeSlots.length > 1) {
      const newSlots = formData.timeSlots.filter((_, i) => i !== index);
      setFormData({ ...formData, timeSlots: newSlots });
    }
  };

  const updateTimeSlot = (index: number, field: "startTime" | "endTime", value: string) => {
    if (formData.timeSlots) {
      const newSlots = [...formData.timeSlots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      setFormData({ ...formData, timeSlots: newSlots });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOvertime 
              ? 'Sửa đơn tăng ca'
              : parentOvertimeId 
                ? 'Tạo đơn tăng ca bổ sung' 
                : 'Tạo đơn tăng ca'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeId">
                Nhân viên <span className="text-red-500">*</span>
              </Label>
              {editingOvertime ? (
                // Khi edit, hiển thị dạng Input disabled để đảm bảo hiển thị đúng
                <Input
                  value={
                    editingOvertime.employee?.user?.fullName || 
                    (editingOvertime.employeeId ? `#${editingOvertime.employeeId}` : 'Chưa chọn nhân viên')
                  }
                  disabled
                  className="bg-gray-50"
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

          <div>
            <Label htmlFor="overtimeDate">
              Ngày tăng ca <span className="text-red-500">*</span>
            </Label>
            <Input
              id="overtimeDate"
              type="date"
              value={formData.overtimeDate}
              // min={editingOvertime ? undefined : new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({ ...formData, overtimeDate: e.target.value })
              }
            />
            {formErrors.overtimeDate && (
              <p className="text-sm text-red-500 mt-1">{formErrors.overtimeDate}</p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">
              Khung giờ tăng ca <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3">
              {formData.timeSlots?.map((slot, index) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Giờ bắt đầu {index + 1}
                      </Label>
                      <Input
                        type="text"
                        placeholder="HH:MM (VD: 05:00)"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTimeSlot(index, "startTime", e.target.value)
                        }
                        className="mt-1"
                      />
                      {formErrors[`timeSlot_${index}_startTime`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors[`timeSlot_${index}_startTime`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">
                        Giờ kết thúc {index + 1}
                      </Label>
                      <Input
                        type="text"
                        placeholder="HH:MM (VD: 07:00)"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTimeSlot(index, "endTime", e.target.value)
                        }
                        className="mt-1"
                      />
                      {formErrors[`timeSlot_${index}_endTime`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors[`timeSlot_${index}_endTime`]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 pt-6">
                    {formData.timeSlots && formData.timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {formData.timeSlots && formData.timeSlots.length < 15 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTimeSlot}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm khung giờ
                </Button>
              )}
              {formErrors.timeSlots && (
                <p className="text-sm text-red-500">{formErrors.timeSlots}</p>
              )}
              <p className="text-xs text-gray-500">
                Hỗ trợ ca qua đêm (VD: 22:00 - 06:00 sáng hôm sau). Tối đa 15 khung giờ.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="overtimeCoefficientId">
              Hệ số làm thêm <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.overtimeCoefficientId > 0 ? formData.overtimeCoefficientId.toString() : undefined}
              onValueChange={(v) =>
                setFormData({ ...formData, overtimeCoefficientId: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn hệ số làm thêm" />
              </SelectTrigger>
              <SelectContent>
                {coefficients
                  .filter((c) => c.isActive)
                  .map((coef) => (
                    <SelectItem key={coef.id} value={coef.id.toString()}>
                      {coef.shiftName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {formErrors.overtimeCoefficientId && (
              <p className="text-sm text-red-500 mt-1">{formErrors.overtimeCoefficientId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Lý do</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Nhập lý do tăng ca..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            {editingOvertime ? 'Cập nhật' : 'Tạo đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
