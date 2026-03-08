import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// removed select imports when employeeId is provided; keep if needed in create mode only
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  dailyProductionApi,
  type CreateDailyProductionPayload,
  type UpdateDailyProductionPayload,
  type DailyProductionItem,
} from "../api/dailyProduction";
import { Calendar, DollarSign, Package } from "lucide-react";
import ErrorMessage from "./commons/ErrorMessage";

interface ProductionInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryId: number;
  onSuccess: () => void;
  employeeId?: number; // when provided, modal is scoped to this employee
  mode?: "create" | "edit";
  initialItem?: DailyProductionItem;
  requireReason?: boolean;
  open?: boolean; // for backward compatibility, use isOpen instead
}

export function ProductionInputModal({
  open,
  isOpen,
  onClose,
  factoryId,
  onSuccess,
  employeeId,
  mode = "create",
  initialItem,
  requireReason = false,
}: ProductionInputModalProps) {
  const [formData, setFormData] = useState<CreateDailyProductionPayload>({
    factoryId: 0,
    employeeId: 0,
    date: new Date().toISOString().split("T")[0],
    productName: "",
    quantity: 0,
    unitPrice: 0,
    price: 0,
    totalPrice: 0,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // create-mode only (currently unused)
  const [dateLocal, setDateLocal] = useState<string>(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const tzOff = now.getTimezoneOffset();
    const local = new Date(now.getTime() - tzOff * 60000)
      .toISOString()
      .slice(0, 16);
    return local; // yyyy-MM-ddTHH:mm
  });
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialItem) {
        setFormData({
          factoryId,
          employeeId: employeeId ?? initialItem.employeeId,
          date: initialItem.date,
          productName: initialItem.productName,
          quantity: +initialItem.quantity,
          unitPrice: +(initialItem?.unitPrice ?? 0),
          price: +(initialItem?.price ?? 0),
          totalPrice: +(initialItem?.totalPrice ?? 0),
        });
        const d = new Date(initialItem.date);
        d.setSeconds(0, 0);
        const tzOff2 = d.getTimezoneOffset();
        const local2 = new Date(d.getTime() - tzOff2 * 60000)
          .toISOString()
          .slice(0, 16);
        setDateLocal(local2);
      } else {
        setFormData({
          factoryId,
          employeeId: employeeId ?? 0,
          date: new Date().toISOString().split("T")[0],
          productName: "",
          quantity: 0,
          unitPrice: 0,
          price: 0,
          totalPrice: 0,
        });
        const now = new Date();
        now.setSeconds(0, 0);
        const tzOff = now.getTimezoneOffset();
        const local = new Date(now.getTime() - tzOff * 60000)
          .toISOString()
          .slice(0, 16);
        setDateLocal(local);
      }
      setError(null);
      setNote("");
      // no employee selector when employeeId is provided from detail page
    }
  }, [isOpen, factoryId, employeeId, mode, initialItem]);

  // removed employee loading/select for edit usage

  const handleInputChange = (
    field: keyof CreateDailyProductionPayload,
    value: any,
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto calculate totalPrice when quantity or unitPrice changes
      if (field === "quantity" || field === "unitPrice") {
        const quantity = field === "quantity" ? Number(value) : prev.quantity;
        const unitPrice =
          field === "unitPrice" ? Number(value) : prev.unitPrice || 0;
        const totalPrice = quantity * unitPrice;
        newData.totalPrice = totalPrice;
        newData.price = totalPrice; // Assuming price = totalPrice for simplicity
      }

      return newData;
    });
  };

  const toBackendDate = (localDatetime: string): string => {
    // input: yyyy-MM-ddTHH:mm -> output: yyyy-MM-dd HH:mm:00
    if (!localDatetime) return "";
    const [d, t] = localDatetime.split("T");
    if (!d || !t) return localDatetime;
    const [hh = "00", mm = "00"] = t.split(":");
    return `${d} ${hh}:${mm}:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalEmployeeId = employeeId ?? formData.employeeId;
    if (!finalEmployeeId || !formData.productName || formData.quantity <= 0) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (requireReason && !note.trim()) {
      setError("Vui lòng nhập lý do chỉnh sửa");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "edit" && initialItem) {
        const payload: UpdateDailyProductionPayload & { note?: string } = {
          productName: formData.productName,
          quantity: formData.quantity,
          unitPrice: formData.unitPrice,
          price: formData.price,
          totalPrice: formData.totalPrice,
          note: note.trim() || undefined,
        };
        await dailyProductionApi.update(initialItem.id, payload);
      } else {
        const payload: CreateDailyProductionPayload = {
          ...formData,
          employeeId: finalEmployeeId,
          date: toBackendDate(dateLocal),
        };
        await dailyProductionApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const message =
        err?.message ||
        err?.data?.errors?.message ||
        "Có lỗi xảy ra khi tạo bản ghi sản xuất";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      factoryId,
      employeeId: 0,
      date: new Date().toISOString().split("T")[0],
      productName: "",
      quantity: 0,
      unitPrice: 0,
      price: 0,
      totalPrice: 0,
    });
    const now = new Date();
    now.setSeconds(0, 0);
    const tzOff = now.getTimezoneOffset();
    const local = new Date(now.getTime() - tzOff * 60000)
      .toISOString()
      .slice(0, 16);
    setDateLocal(local);
    setError(null);
    onClose();
  };

  const isFormValid =
    (employeeId ? true : formData.employeeId > 0) &&
    formData.productName.trim().length > 0 &&
    formData.quantity > 0 &&
    (!requireReason || note.trim().length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === "edit" ? "Cập nhật sản lượng" : "Nhập sản lượng sản xuất"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage error={error} setError={setError} />}
          {mode === "edit" && initialItem?.note && (
            <div className="p-3 rounded-md border border-yellow-200 bg-yellow-50 text-sm text-gray-700">
              <div className="font-medium mb-1">Ghi chú hiện tại:</div>
              <div className="whitespace-pre-wrap">{initialItem.note}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Ngày sản xuất {mode === "edit" ? "" : "*"}
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="datetime-local"
                  value={dateLocal}
                  onChange={(e) => setDateLocal(e.target.value)}
                  className="pl-10"
                  disabled={mode === "edit"}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productName">Tên sản phẩm *</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => handleInputChange("productName", e.target.value)}
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  handleInputChange("quantity", parseInt(e.target.value) || 0)
                }
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Đơn giá (VND)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "unitPrice",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="0"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">Thành tiền (VND)</Label>
              <Input
                id="totalPrice"
                type="number"
                value={formData.totalPrice}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {requireReason && (
            <div className="space-y-2">
              <Label htmlFor="note">Lý do chỉnh sửa *</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lý do chỉnh sửa"
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting || !isFormValid}>
              {submitting
                ? "Đang lưu..."
                : mode === "edit"
                  ? "Cập nhật"
                  : "Thêm sản lượng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProductionInputModal;
