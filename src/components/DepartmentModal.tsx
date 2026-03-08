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
import type { Department } from "../types/department";
import ErrorMessage from "./commons/ErrorMessage";

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  department?: Department | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    status?: string;
  }) => Promise<void> | void;
}

export function DepartmentModal({
  isOpen,
  onClose,
  mode,
  department,
  onSubmit,
}: DepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when department changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && department) {
      setFormData({
        name: department.name || "",
        description: department.description || "",
        status: department.status || "active",
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: "",
        description: "",
        status: "active",
      });
    }
  }, [mode, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên phòng ban");
      return;
    }

    showLoading(mode === 'create' ? "Đang tạo phòng ban..." : "Đang cập nhật phòng ban...");
    
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      });
      
      // Reset form after successful submission
      if (mode === 'create') {
        setFormData({
          name: "",
          description: "",
          status: "active",
        });
      }
    } catch (err: any) {
      const message =
        err?.message || err?.data?.errors?.message || 
        (mode === 'create' ? "Tạo phòng ban thất bại" : "Cập nhật phòng ban thất bại");
      setError(
        typeof message === "string" ? message : 
        (mode === 'create' ? "Tạo phòng ban thất bại" : "Cập nhật phòng ban thất bại")
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
    });
    setError(null);
    onClose();
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm phòng ban mới' : 'Chỉnh sửa phòng ban'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage error={error} setError={setError} />}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Tên phòng ban <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên phòng ban"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả phòng ban"
                rows={3}
              />
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
                mode === 'create' ? "Tạo phòng ban" : "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DepartmentModal;
