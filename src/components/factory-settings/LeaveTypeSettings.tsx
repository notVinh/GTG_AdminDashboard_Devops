import { useEffect, useState } from "react";
import { leaveTypeApi } from "../../api/leave-type";
import { employeeApi } from "../../api/employee";
import type {
  LeaveTypeConfig,
  CreateLeaveTypeConfigDto,
  UpdateLeaveTypeConfigDto,
} from "../../types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Plus, Pencil, Trash2, DollarSign, Calendar } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

export default function LeaveTypeSettings() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [items, setItems] = useState<LeaveTypeConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateLeaveTypeConfigDto>({
    factoryId: 0,
    code: "",
    name: "",
    isPaid: true,
    deductsFromAnnualLeave: true,
    description: "",
    isActive: true,
    sortOrder: 0,
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

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
      const list = await leaveTypeApi.getByFactory(factoryId);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.code.trim()) {
      errors.code = "Vui lòng nhập mã loại nghỉ phép";
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      errors.code = "Mã chỉ được chứa chữ in hoa, số và dấu gạch dưới";
    }

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập tên loại nghỉ phép";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const created = await leaveTypeApi.create(formData);
      setItems((prev) => [...prev, created]);
      setShowCreateModal(false);
      resetForm();
      toast.success("Đã thêm loại nghỉ phép!");
    } catch (error: any) {
      console.error("Error creating leave type:", error);
      toast.error(error?.message || "Lỗi khi tạo loại nghỉ phép");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!validateForm()) return;

    try {
      const payload: UpdateLeaveTypeConfigDto = {
        code: formData.code,
        name: formData.name,
        isPaid: formData.isPaid,
        deductsFromAnnualLeave: formData.deductsFromAnnualLeave,
        description: formData.description,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };
      const updated = await leaveTypeApi.update(id, payload);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowEditModal(null);
      resetForm();
      toast.success("Đã cập nhật loại nghỉ phép!");
    } catch (error: any) {
      console.error("Error updating leave type:", error);
      toast.error(error?.message || "Lỗi khi cập nhật loại nghỉ phép");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa loại nghỉ phép "${
        items.find((x) => x.id === id)?.name
      }"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!result) return;

    try {
      await leaveTypeApi.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Đã xóa loại nghỉ phép!");
    } catch (error: any) {
      console.error("Error deleting leave type:", error);
      toast.error(error?.message || "Lỗi khi xóa loại nghỉ phép");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const updated = await leaveTypeApi.update(id, { isActive: !isActive });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      toast.success(isActive ? "Đã tạm dừng loại nghỉ phép!" : "Đã kích hoạt loại nghỉ phép!");
    } catch (error: any) {
      console.error("Error toggling active status:", error);
      toast.error(error?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const resetForm = () => {
    setFormData({
      factoryId: factoryId || 0,
      code: "",
      name: "",
      isPaid: true,
      deductsFromAnnualLeave: true,
      description: "",
      isActive: true,
      sortOrder: 0,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (item: LeaveTypeConfig) => {
    setFormData({
      factoryId: item.factoryId,
      code: item.code,
      name: item.name,
      isPaid: item.isPaid,
      deductsFromAnnualLeave: item.deductsFromAnnualLeave,
      description: item.description || "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
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
            Loại nghỉ phép
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý các loại nghỉ phép cho nhân viên
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm loại nghỉ
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên loại nghỉ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Có lương
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trừ phép năm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
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
                    Chưa có loại nghỉ phép nào. Nhấn "Thêm loại nghỉ" để tạo mới.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${!item.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`h-4 w-4 ${item.isPaid ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={item.isPaid ? 'text-green-600' : 'text-gray-500'}>
                          {item.isPaid ? 'Có' : 'Không'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${item.deductsFromAnnualLeave ? 'text-orange-500' : 'text-gray-400'}`} />
                        <span className={item.deductsFromAnnualLeave ? 'text-orange-600' : 'text-gray-500'}>
                          {item.deductsFromAnnualLeave ? 'Có' : 'Không'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
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
              {showCreateModal ? "Thêm loại nghỉ phép" : "Sửa loại nghỉ phép"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">
                  Mã loại nghỉ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="VD: ANNUAL_LEAVE"
                />
                {formErrors.code && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: Number(e.target.value) })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">
                Tên loại nghỉ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Phép năm"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox
                  id="isPaid"
                  checked={formData.isPaid}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isPaid: !!v })
                  }
                />
                <div>
                  <Label htmlFor="isPaid" className="cursor-pointer font-medium">
                    Có hưởng lương
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nhân viên vẫn được trả lương khi nghỉ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox
                  id="deductsFromAnnualLeave"
                  checked={formData.deductsFromAnnualLeave}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, deductsFromAnnualLeave: !!v })
                  }
                />
                <div>
                  <Label htmlFor="deductsFromAnnualLeave" className="cursor-pointer font-medium">
                    Trừ phép năm
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Trừ vào số ngày phép năm của nhân viên
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết về loại nghỉ phép này..."
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
