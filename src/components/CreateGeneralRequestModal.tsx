import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { SelectWithSearch } from "./ui/select-with-search";
import { generalRequestApi, type CreateGeneralRequestPayload } from "../api/generalRequest";
import { employeeApi } from "../api/employee";
import type { EmployeeWithDetails } from "../types";

interface CreateGeneralRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function CreateGeneralRequestModal({
  open,
  onClose,
  onSuccess,
  onError,
}: CreateGeneralRequestModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [approverEmployeeId, setApproverEmployeeId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    approverEmployeeId?: string;
  }>({});

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      // Trying to fetch all employees first. 
      // In a real factory app, we'd probably get the current factory ID from context/LocalStorage.
      const empInfoRaw = localStorage.getItem("employee_info");
      let factoryId: number | undefined;
      if (empInfoRaw) {
        const empInfo = JSON.parse(empInfoRaw);
        factoryId = empInfo.factoryId;
      }

      let result: EmployeeWithDetails[] = [];
      if (factoryId) {
        const allEmployees = await employeeApi.getByFactory(factoryId);
        result = allEmployees.filter((emp) => emp.isManager);
      } else {
        // Fallback for superadmin or when factoryId is missing
        const res = await employeeApi.listEmployeesWithDetails(1, 1000, 0, {
          isManager: "true",
        });
        result = res.data;
      }
      setEmployees(result);
    } catch (error) {
      console.error("Error fetching employees for approver selection:", error);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setApproverEmployeeId(null);
      setErrors({});
      fetchEmployees();
    }
  }, [open, fetchEmployees]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề";
    }

    if (!content.trim()) {
      newErrors.content = "Vui lòng nhập nội dung yêu cầu";
    }

    if (!approverEmployeeId) {
      newErrors.approverEmployeeId = "Vui lòng chọn người duyệt";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const payload: CreateGeneralRequestPayload = {
        title: title.trim(),
        content: content.trim(),
        approverEmployeeId: approverEmployeeId!,
      };

      await generalRequestApi.createRequest(payload);
      onSuccess("Tạo yêu cầu thành công");
      handleClose();
    } catch (error: any) {
      onError(error.message || "Có lỗi xảy ra khi tạo yêu cầu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Ví dụ: Yêu cầu văn phòng phẩm"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="approver">
              Người duyệt <span className="text-red-500">*</span>
            </Label>
            {loadingEmployees ? (
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                Đang tải danh sách nhân viên...
              </div>
            ) : (
              <SelectWithSearch
                value={approverEmployeeId?.toString()}
                onChange={(val) => {
                  setApproverEmployeeId(val ? Number(val) : null);
                  if (errors.approverEmployeeId) {
                    setErrors((prev) => ({ ...prev, approverEmployeeId: undefined }));
                  }
                }}
                placeholder="Chọn người phê duyệt"
                options={employees.map((emp) => ({
                  value: emp.id.toString(),
                  label: emp.user?.fullName || emp.user?.phone || `NV-${emp.id}`,
                  extra: emp.position?.name,
                }))}
              />
            )}
            {errors.approverEmployeeId && (
              <p className="text-xs text-red-500 mt-1">{errors.approverEmployeeId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="content">
              Nội dung yêu cầu <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) {
                  setErrors((prev) => ({ ...prev, content: undefined }));
                }
              }}
              rows={4}
              placeholder="Chi tiết nội dung yêu cầu..."
              className={errors.content ? "border-red-500" : ""}
            />
            {errors.content && (
              <p className="text-xs text-red-500 mt-1">{errors.content}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingEmployees}>
            {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
