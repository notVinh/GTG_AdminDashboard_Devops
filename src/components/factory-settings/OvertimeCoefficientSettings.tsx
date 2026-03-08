import { useEffect, useState } from "react";
import { overtimeCoefficientApi } from "../../api/overtime-coefficient";
import { employeeApi } from "../../api/employee";
import type {
  OvertimeCoefficient,
  CreateOvertimeCoefficientDto,
  UpdateOvertimeCoefficientDto,
  ShiftType,
  DayType,
} from "../../types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Plus, Pencil, Trash2, Sun, Moon } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

export default function OvertimeCoefficientSettings() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [items, setItems] = useState<OvertimeCoefficient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateOvertimeCoefficientDto>({
    factoryId: 0,
    shiftName: "",
    coefficient: 150,
    shiftType: "DAY" as ShiftType,
    dayType: "WEEKDAY" as DayType,
    hasWorkedDayShift: false,
    description: "",
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted && me) {
          const fId = Number((me as any).factoryId);
          setFactoryId(fId);
          setFormData((prev) => ({ ...prev, factoryId: fId }));
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!factoryId) return;
    loadData();
  }, [factoryId]);

  const loadData = async () => {
    if (!factoryId) return;
    setLoading(true);
    try {
      const list = await overtimeCoefficientApi.getByFactory(factoryId);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  const shiftTypeLabel = (type: ShiftType) => {
    return type === "DAY" ? "Ban ngày" : "Ban đêm";
  };

  const dayTypeLabel = (type: DayType) => {
    return type === "WEEKDAY"
      ? "Ngày thường"
      : type === "WEEKEND"
      ? "Cuối tuần"
      : "Ngày lễ";
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.shiftName.trim()) {
      errors.shiftName = "Vui lòng nhập tên ca làm";
    }

    if (!formData.coefficient || formData.coefficient <= 0) {
      errors.coefficient = "Hệ số phải lớn hơn 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const created = await overtimeCoefficientApi.create(formData);
      setItems((prev) => [...prev, created]);
      setShowCreateModal(false);
      resetForm();
      toast.success("Đã thêm hệ số làm thêm!");
    } catch (error) {
      console.error("Error creating coefficient:", error);
      toast.error("Lỗi khi tạo hệ số");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!validateForm()) return;

    try {
      const payload: UpdateOvertimeCoefficientDto = {
        shiftName: formData.shiftName,
        coefficient: formData.coefficient,
        shiftType: formData.shiftType,
        dayType: formData.dayType,
        hasWorkedDayShift: formData.hasWorkedDayShift,
        description: formData.description,
        isActive: formData.isActive,
      };
      const updated = await overtimeCoefficientApi.update(id, payload);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowEditModal(null);
      resetForm();
      toast.success("Đã cập nhật hệ số!");
    } catch (error) {
      console.error("Error updating coefficient:", error);
      toast.error("Lỗi khi cập nhật hệ số");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa hệ số "${
        items.find((x) => x.id === id)?.shiftName
      }"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!result) return;

    try {
      await overtimeCoefficientApi.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Đã xóa hệ số!");
    } catch (error) {
      console.error("Error deleting coefficient:", error);
      toast.error("Lỗi khi xóa hệ số");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const updated = await overtimeCoefficientApi.update(id, { isActive: !isActive });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      toast.success(isActive ? "Đã tạm dừng hệ số!" : "Đã kích hoạt hệ số!");
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const resetForm = () => {
    setFormData({
      factoryId: factoryId || 0,
      shiftName: "",
      coefficient: 150,
      shiftType: "DAY" as ShiftType,
      dayType: "WEEKDAY" as DayType,
      hasWorkedDayShift: false,
      description: "",
      isActive: true,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (item: OvertimeCoefficient) => {
    setFormData({
      factoryId: item.factoryId,
      shiftName: item.shiftName,
      coefficient: item.coefficient,
      shiftType: item.shiftType,
      dayType: item.dayType,
      hasWorkedDayShift: item.hasWorkedDayShift,
      description: item.description || "",
      isActive: item.isActive,
    });
    setFormErrors({});
    setShowEditModal(item.id);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Hệ số làm thêm giờ
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý các hệ số tính lương cho làm thêm giờ
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm hệ số
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên ca làm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hệ số
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại ca
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại ngày
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Chưa có hệ số nào. Nhấn "Thêm hệ số" để tạo mới.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.shiftName}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {item.coefficient}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        {item.shiftType === "DAY" ? (
                          <Sun className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Moon className="h-4 w-4 text-blue-500" />
                        )}
                        {shiftTypeLabel(item.shiftType)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {dayTypeLabel(item.dayType)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={item.isActive ? "default" : "outline"}
                          className={item.isActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                        >
                          {item.isActive ? "Tắt" : "Bật"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || !!showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setShowEditModal(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showCreateModal ? "Thêm hệ số làm thêm" : "Sửa hệ số làm thêm"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="shiftName">
                Tên ca làm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shiftName"
                value={formData.shiftName}
                onChange={(e) =>
                  setFormData({ ...formData, shiftName: e.target.value })
                }
                placeholder="VD: Ca đêm ngày thường"
              />
              {formErrors.shiftName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.shiftName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="coefficient">
                Hệ số (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="coefficient"
                type="number"
                value={formData.coefficient}
                onChange={(e) =>
                  setFormData({ ...formData, coefficient: Number(e.target.value) })
                }
                placeholder="VD: 150"
                min="0"
                step="0.01"
              />
              {formErrors.coefficient && (
                <p className="text-sm text-red-500 mt-1">{formErrors.coefficient}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shiftType">Loại ca</Label>
                <Select
                  value={formData.shiftType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, shiftType: v as ShiftType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Ban ngày</SelectItem>
                    <SelectItem value="NIGHT">Ban đêm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dayType">Loại ngày</Label>
                <Select
                  value={formData.dayType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, dayType: v as DayType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKDAY">Ngày thường</SelectItem>
                    <SelectItem value="WEEKEND">Cuối tuần</SelectItem>
                    <SelectItem value="HOLIDAY">Ngày lễ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="hasWorkedDayShift"
                checked={formData.hasWorkedDayShift}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, hasWorkedDayShift: !!v })
                }
              />
              <Label htmlFor="hasWorkedDayShift" className="cursor-pointer">
                Đã làm ca ngày (áp dụng cho ca đêm)
              </Label>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết về hệ số này..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, isActive: !!v })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Hoạt động
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(null);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (showEditModal) {
                  handleUpdate(showEditModal);
                } else {
                  handleCreate();
                }
              }}
            >
              {showCreateModal ? "Tạo mới" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
