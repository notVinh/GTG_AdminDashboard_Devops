import { useEffect, useState } from "react";
import { supportTypeApi } from "../../api/support-request";
import { employeeApi } from "../../api/employee";
import type { SupportType, CreateSupportTypeDto, UpdateSupportTypeDto } from "../../types/support-request";
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
import { Checkbox } from "../ui/checkbox";
import { Plus, Pencil, Trash2, Camera, Hash } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

export default function SupportTypeSettings() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [items, setItems] = useState<SupportType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateSupportTypeDto>({
    factoryId: 0,
    code: "",
    name: "",
    unit: "",
    requirePhoto: false,
    requireQuantity: false,
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
      const list = await supportTypeApi.getByFactory(factoryId);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.code.trim()) {
      errors.code = "Vui lòng nhập mã loại hỗ trợ";
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      errors.code = "Mã chỉ được chứa chữ thường, số và dấu gạch dưới";
    }

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập tên loại hỗ trợ";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const created = await supportTypeApi.create(formData);
      setItems((prev) => [...prev, created]);
      setShowCreateModal(false);
      resetForm();
      toast.success("Đã thêm loại hỗ trợ!");
    } catch (error: any) {
      console.error("Error creating support type:", error);
      toast.error(error?.message || "Lỗi khi tạo loại hỗ trợ");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!validateForm()) return;

    try {
      const payload: UpdateSupportTypeDto = {
        code: formData.code,
        name: formData.name,
        unit: formData.unit,
        requirePhoto: formData.requirePhoto,
        requireQuantity: formData.requireQuantity,
      };
      const updated = await supportTypeApi.update(id, payload);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowEditModal(null);
      resetForm();
      toast.success("Đã cập nhật loại hỗ trợ!");
    } catch (error: any) {
      console.error("Error updating support type:", error);
      toast.error(error?.message || "Lỗi khi cập nhật loại hỗ trợ");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa loại hỗ trợ "${
        items.find((x) => x.id === id)?.name
      }"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!result) return;

    try {
      await supportTypeApi.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Đã xóa loại hỗ trợ!");
    } catch (error: any) {
      console.error("Error deleting support type:", error);
      toast.error(error?.message || "Lỗi khi xóa loại hỗ trợ");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const updated = await supportTypeApi.update(id, { isActive: !isActive });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      toast.success(isActive ? "Đã tạm dừng loại hỗ trợ!" : "Đã kích hoạt loại hỗ trợ!");
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
      unit: "",
      requirePhoto: false,
      requireQuantity: false,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (item: SupportType) => {
    setFormData({
      factoryId: item.factoryId,
      code: item.code,
      name: item.name,
      unit: item.unit || "",
      requirePhoto: item.requirePhoto,
      requireQuantity: item.requireQuantity,
    });
    setFormErrors({});
    setShowEditModal(item.id);
  };

  const handleSeedDefaults = async () => {
    if (!factoryId) return;

    const result = await confirm({
      title: "Tạo loại hỗ trợ mặc định",
      message: "Hệ thống sẽ tạo các loại hỗ trợ mặc định (Qua đêm x50, Qua đêm x100, Làm quá 20h30, Km xe máy, Km ô tô). Các loại đã tồn tại sẽ không bị thay đổi.",
      confirmText: "Tạo",
      cancelText: "Hủy",
    });

    if (!result) return;

    try {
      const seeded = await supportTypeApi.seedDefaultTypes(factoryId);
      setItems(seeded);
      toast.success("Đã tạo các loại hỗ trợ mặc định!");
    } catch (error: any) {
      console.error("Error seeding default types:", error);
      toast.error(error?.message || "Lỗi khi tạo loại hỗ trợ mặc định");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Loại hỗ trợ
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý các loại hỗ trợ (qua đêm, km xe, ...)
          </p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button onClick={handleSeedDefaults} variant="outline" size="sm">
              Tạo mặc định
            </Button>
          )}
          <Button onClick={openCreateModal} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Thêm loại
          </Button>
        </div>
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
                  Tên loại
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đơn vị
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Yêu cầu ảnh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Yêu cầu SL
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Chưa có loại hỗ trợ nào. Nhấn "Tạo mặc định" hoặc "Thêm loại" để tạo mới.
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
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.unit || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Camera className={`h-4 w-4 ${item.requirePhoto ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className={item.requirePhoto ? 'text-blue-600' : 'text-gray-500'}>
                          {item.requirePhoto ? 'Có' : 'Không'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Hash className={`h-4 w-4 ${item.requireQuantity ? 'text-purple-500' : 'text-gray-400'}`} />
                        <span className={item.requireQuantity ? 'text-purple-600' : 'text-gray-500'}>
                          {item.requireQuantity ? 'Có' : 'Không'}
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
              {showCreateModal ? "Thêm loại hỗ trợ" : "Sửa loại hỗ trợ"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">
                  Mã loại hỗ trợ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toLowerCase() })
                  }
                  placeholder="VD: overnight_x50"
                />
                {formErrors.code && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit">Đơn vị</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="VD: km, ngày"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">
                Tên loại hỗ trợ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Qua đêm x50"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox
                  id="requirePhoto"
                  checked={formData.requirePhoto}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, requirePhoto: !!v })
                  }
                />
                <div>
                  <Label htmlFor="requirePhoto" className="cursor-pointer font-medium">
                    Yêu cầu ảnh chứng minh
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nhân viên phải chụp ảnh khi tạo yêu cầu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox
                  id="requireQuantity"
                  checked={formData.requireQuantity}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, requireQuantity: !!v })
                  }
                />
                <div>
                  <Label htmlFor="requireQuantity" className="cursor-pointer font-medium">
                    Yêu cầu nhập số lượng
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nhân viên phải nhập số lượng (km, ...)
                  </p>
                </div>
              </div>
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
