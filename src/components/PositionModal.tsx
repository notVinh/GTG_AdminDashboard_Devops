import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { LoadingButton } from "./commons/Loading";
import { useLoading } from "../contexts/LoadingContext";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
import type { PositionEmployee, Department } from "../types/department";
import ErrorMessage from "./commons/ErrorMessage";

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  position?: PositionEmployee | null;
  departments: Department[];
  onSubmit: (data: {
    name: string;
    description: string;
    status?: string;
    departmentId: number;
  }) => Promise<void> | void;
}

export function PositionModal({
  isOpen,
  onClose,
  mode,
  position,
  departments,
  onSubmit,
}: PositionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    departmentId: "",
  });
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when position changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && position) {
      setFormData({
        name: position.name || "",
        description: position.description || "",
        status: position.status || "active",
        departmentId: position.departmentId?.toString() || "",
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: "",
        description: "",
        status: "active",
        departmentId: "",
      });
    }
  }, [mode, position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên vị trí");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("Vui lòng nhập mô tả vị trí");
      return;
    }
    
    if (!formData.departmentId) {
      setError("Vui lòng chọn phòng ban");
      return;
    }

    showLoading(mode === 'create' ? "Đang tạo vị trí..." : "Đang cập nhật vị trí...");
    
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        departmentId: parseInt(formData.departmentId),
      });
      
      // Reset form after successful submission
      if (mode === 'create') {
        setFormData({
          name: "",
          description: "",
          status: "active",
          departmentId: "",
        });
      }
    } catch (err: any) {
      const message =
        err?.message || err?.data?.errors?.message || 
        (mode === 'create' ? "Tạo vị trí thất bại" : "Cập nhật vị trí thất bại");
      setError(
        typeof message === "string" ? message : 
        (mode === 'create' ? "Tạo vị trí thất bại" : "Cập nhật vị trí thất bại")
      );
    } finally {
      hideLoading();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      departmentId: "",
    });
    setError(null);
    onClose();
  };

  const isFormValid = formData.name.trim().length > 0 && 
                     formData.description.trim().length > 0 && 
                     formData.departmentId.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm vị trí mới' : 'Chỉnh sửa vị trí'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage error={error} setError={setError} />}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Tên vị trí <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên vị trí"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                Mô tả <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả vị trí"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="departmentId">
                Phòng ban <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
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
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
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
                mode === 'create' ? "Tạo vị trí" : "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PositionModal;
