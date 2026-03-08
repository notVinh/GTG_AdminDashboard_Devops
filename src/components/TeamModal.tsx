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
import type { Team, Department } from "../types/department";
import ErrorMessage from "./commons/ErrorMessage";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  team?: Team | null;
  departments: Department[];
  onSubmit: (data: {
    name: string;
    description?: string;
    status?: string;
    departmentId: number;
  }) => Promise<void> | void;
}

export function TeamModal({
  isOpen,
  onClose,
  mode,
  team,
  departments,
  onSubmit,
}: TeamModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    departmentId: "",
  });
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when team changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && team) {
      setFormData({
        name: team.name || "",
        description: team.description || "",
        status: team.status || "active",
        departmentId: team.departmentId?.toString() || "",
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
  }, [mode, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên tổ");
      return;
    }

    if (!formData.departmentId) {
      setError("Vui lòng chọn phòng ban");
      return;
    }

    showLoading(mode === 'create' ? "Đang tạo tổ..." : "Đang cập nhật tổ...");

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
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
        (mode === 'create' ? "Tạo tổ thất bại" : "Cập nhật tổ thất bại");
      setError(
        typeof message === "string" ? message :
        (mode === 'create' ? "Tạo tổ thất bại" : "Cập nhật tổ thất bại")
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
                     formData.departmentId.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm tổ mới' : 'Chỉnh sửa tổ'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage error={error} setError={setError} />}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Tên tổ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên tổ (VD: Tổ 1, Tổ 2)"
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
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả tổ"
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
                mode === 'create' ? "Tạo tổ" : "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TeamModal;
