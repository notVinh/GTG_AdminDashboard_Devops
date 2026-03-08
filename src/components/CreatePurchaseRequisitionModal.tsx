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
import { purchaseRequisitionApi } from "../api/purchase-requisition";
import { misaDataSourceApi, type MisaSaOrder } from "../api/misa-data-source";
import type { CreatePurchaseRequisitionDto } from "../types/purchase-requisition";
import { format, subDays } from "date-fns";

interface CreatePurchaseRequisitionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function CreatePurchaseRequisitionModal({
  open,
  onClose,
  onSuccess,
  onError,
}: CreatePurchaseRequisitionModalProps) {
  const [requisitionNumber, setRequisitionNumber] = useState("");
  const [misaSaOrderId, setMisaSaOrderId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    requisitionNumber?: string;
    notes?: string;
  }>({});

  // Sales order selection
  const [saOrderList, setSaOrderList] = useState<MisaSaOrder[]>([]);
  const [loadingSaOrders, setLoadingSaOrders] = useState(false);
  const [saOrderStartDate, setSaOrderStartDate] = useState("");
  const [saOrderEndDate, setSaOrderEndDate] = useState("");

  // Generate requisition number
  const generateRequisitionNumber = useCallback(() => {
    const timestamp = Date.now();
    return `ĐXMH-${timestamp}`;
  }, []);

  // Fetch sales orders with date range
  const fetchSaOrders = useCallback(
    async (startDate?: string, endDate?: string) => {
      setLoadingSaOrders(true);
      try {
        const result = await misaDataSourceApi.getSaOrders(
          1,
          100,
          undefined,
          startDate,
          endDate
        );
        setSaOrderList(result.data || []);
      } catch (error) {
        console.error("Error fetching sales orders:", error);
        setSaOrderList([]);
      } finally {
        setLoadingSaOrders(false);
      }
    },
    []
  );

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      setRequisitionNumber(generateRequisitionNumber());
      setMisaSaOrderId(null);
      setNotes("");

      // Set default date range: last 60 days to today
      const today = new Date();
      const startDate = format(subDays(today, 60), "yyyy-MM-dd");
      const endDate = format(today, "yyyy-MM-dd");
      setSaOrderStartDate(startDate);
      setSaOrderEndDate(endDate);
      fetchSaOrders(startDate, endDate);
    }
  }, [open, generateRequisitionNumber, fetchSaOrders]);

  // Refetch when date range changes
  const handleDateRangeChange = (start: string, end: string) => {
    setSaOrderStartDate(start);
    setSaOrderEndDate(end);
    if (start && end) {
      fetchSaOrders(start, end);
    }
  };

  const handleClose = () => {
    setRequisitionNumber("");
    setMisaSaOrderId(null);
    setNotes("");
    setSaOrderStartDate("");
    setSaOrderEndDate("");
    setSaOrderList([]);
    setErrors({});
    onClose();
  };

  const handleSave = async () => {
    // Validate
    const newErrors: { requisitionNumber?: string; notes?: string } = {};

    if (!requisitionNumber.trim()) {
      newErrors.requisitionNumber = "Vui lòng nhập số đề xuất";
    }

    if (!notes.trim()) {
      newErrors.notes = "Vui lòng nhập ghi chú";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const data: CreatePurchaseRequisitionDto = {
        requisitionNumber: requisitionNumber.trim(),
        misaSaOrderId: misaSaOrderId,
        notes: notes.trim(),
      };

      await purchaseRequisitionApi.create(data);
      onSuccess("Tạo đề xuất mua hàng thành công");
      handleClose();
    } catch (error: any) {
      onError(error.message || "Có lỗi xảy ra khi tạo đề xuất");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo đề xuất mua hàng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Requisition Number */}
          <div>
            <Label htmlFor="requisitionNumber">
              Số đề xuất <span className="text-red-500">*</span>
            </Label>
            <Input
              id="requisitionNumber"
              value={requisitionNumber}
              onChange={(e) => {
                setRequisitionNumber(e.target.value);
                if (errors.requisitionNumber) {
                  setErrors((prev) => ({
                    ...prev,
                    requisitionNumber: undefined,
                  }));
                }
              }}
              placeholder="DXMH-..."
              className={errors.requisitionNumber ? "border-red-500" : ""}
            />
            {errors.requisitionNumber && (
              <p className="text-xs text-red-500 mt-1">
                {errors.requisitionNumber}
              </p>
            )}
          </div>

          {/* Sales Order Selection (Optional) */}
          <div>
            <Label>Đơn bán hàng (tùy chọn)</Label>

            {/* Date range filter */}
            <div className="flex gap-2 mt-1 mb-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={saOrderStartDate}
                  onChange={(e) =>
                    handleDateRangeChange(e.target.value, saOrderEndDate)
                  }
                  className="text-xs h-8"
                  title="Từ ngày"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  value={saOrderEndDate}
                  onChange={(e) =>
                    handleDateRangeChange(saOrderStartDate, e.target.value)
                  }
                  className="text-xs h-8"
                  title="Đến ngày"
                />
              </div>
            </div>

            {loadingSaOrders ? (
              <div className="flex items-center justify-center py-3 border rounded-md bg-gray-50">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-gray-500">Đang tải...</span>
              </div>
            ) : (
              <SelectWithSearch
                value={misaSaOrderId ? misaSaOrderId.toString() : undefined}
                onChange={(v) => setMisaSaOrderId(v ? Number(v) : null)}
                placeholder="-- Chọn đơn bán hàng (không bắt buộc) --"
                options={saOrderList.map((order) => ({
                  value: order.id.toString(),
                  label: order.refNo,
                  extra: order.accountObjectName || undefined,
                }))}
              />
            )}

            {misaSaOrderId && (
              <p className="mt-1 text-xs text-gray-500">
                {(() => {
                  const selected = saOrderList.find(
                    (o) => o.id === misaSaOrderId
                  );
                  if (selected) {
                    return `Khách hàng: ${selected.accountObjectName || "N/A"}`;
                  }
                  return null;
                })()}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-400">
              Tìm thấy {saOrderList.length} đơn bán hàng trong khoảng thời gian
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">
              Ghi chú <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) {
                  setErrors((prev) => ({ ...prev, notes: undefined }));
                }
              }}
              rows={3}
              placeholder="Nhập ghi chú (bắt buộc)..."
              className={errors.notes ? "border-red-500" : ""}
            />
            {errors.notes && (
              <p className="text-xs text-red-500 mt-1">{errors.notes}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Tạo đề xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
