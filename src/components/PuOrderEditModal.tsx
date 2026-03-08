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
import { misaDataSourceApi, type MisaPuOrder } from "../api/misa-data-source";
import { purchaseRequisitionApi } from "../api/purchase-requisition";
import type { PurchaseRequisition } from "../types/purchase-requisition";
import { format, subDays } from "date-fns";

interface PuOrderEditModalProps {
  open: boolean;
  order: MisaPuOrder | null;
  onClose: () => void;
  onSuccess: (updatedOrder: MisaPuOrder) => void;
  onError: (message: string) => void;
}

export default function PuOrderEditModal({
  open,
  order,
  onClose,
  onSuccess,
  onError,
}: PuOrderEditModalProps) {
  const [expectedDate, setExpectedDate] = useState("");
  const [dxmhId, setDxmhId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [dxmhList, setDxmhList] = useState<PurchaseRequisition[]>([]);
  const [loadingDxmh, setLoadingDxmh] = useState(false);
  const [dxmhStartDate, setDxmhStartDate] = useState("");
  const [dxmhEndDate, setDxmhEndDate] = useState("");

  // Fetch DXMH list with date range
  const fetchDxmhList = useCallback(async (startDate?: string, endDate?: string) => {
    setLoadingDxmh(true);
    try {
      const result = await purchaseRequisitionApi.getAll({
        page: 1,
        limit: 100,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setDxmhList(result.data || []);
    } catch (error) {
      console.error("Error fetching DXMH list:", error);
      setDxmhList([]);
    } finally {
      setLoadingDxmh(false);
    }
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (open && order) {
      setExpectedDate(
        order.expectedArrivalDate
          ? format(new Date(order.expectedArrivalDate), "yyyy-MM-dd")
          : ""
      );
      setDxmhId(order.purchaseRequisitionId);
      setNotes(order.localNotes || "");

      // Set default date range: last 30 days to next 30 days
      const today = new Date();
      const startDate = format(subDays(today, 30), "yyyy-MM-dd");
      const endDate = format(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()), "yyyy-MM-dd");
      setDxmhStartDate(startDate);
      setDxmhEndDate(endDate);
      fetchDxmhList(startDate, endDate);
    }
  }, [open, order, fetchDxmhList]);

  // Refetch when date range changes
  const handleDateRangeChange = (start: string, end: string) => {
    setDxmhStartDate(start);
    setDxmhEndDate(end);
    if (start && end) {
      fetchDxmhList(start, end);
    }
  };

  const handleClose = () => {
    setExpectedDate("");
    setDxmhId(null);
    setNotes("");
    setDxmhStartDate("");
    setDxmhEndDate("");
    setDxmhList([]);
    onClose();
  };

  const handleSave = async () => {
    if (!order) return;

    setSaving(true);
    try {
      // Get saOrderId from selected DXMH
      let saOrderId: number | null = null;
      if (dxmhId) {
        const selectedDxmh = dxmhList.find((d) => d.id === dxmhId);
        saOrderId = selectedDxmh?.misaSaOrderId || null;
      }

      const updatedOrder = await misaDataSourceApi.updatePuOrderLocalFields(
        order.id,
        {
          expectedArrivalDate: expectedDate || null,
          purchaseRequisitionId: dxmhId,
          saOrderId: saOrderId,
          localNotes: notes || null,
        }
      );

      onSuccess(updatedOrder);
      handleClose();
    } catch (error: any) {
      onError(error.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nhập thông tin - {order?.refNo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expected Arrival Date */}
          <div>
            <Label htmlFor="expectedDate">Ngày về dự kiến</Label>
            <Input
              id="expectedDate"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          {/* DXMH Selection */}
          <div>
            <Label>Đề xuất mua hàng (DXMH)</Label>

            {/* Date range filter */}
            <div className="flex gap-2 mt-1 mb-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={dxmhStartDate}
                  onChange={(e) => handleDateRangeChange(e.target.value, dxmhEndDate)}
                  className="text-xs h-8"
                  title="Từ ngày"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  value={dxmhEndDate}
                  onChange={(e) => handleDateRangeChange(dxmhStartDate, e.target.value)}
                  className="text-xs h-8"
                  title="Đến ngày"
                />
              </div>
            </div>

            {loadingDxmh ? (
              <div className="flex items-center justify-center py-3 border rounded-md bg-gray-50">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-gray-500">Đang tải...</span>
              </div>
            ) : (
              <SelectWithSearch
                value={dxmhId ? dxmhId.toString() : undefined}
                onChange={(v) => setDxmhId(v ? Number(v) : null)}
                placeholder="-- Chọn DXMH --"
                options={dxmhList.map((dxmh) => ({
                  value: dxmh.id.toString(),
                  label: dxmh.requisitionNumber,
                  extra: dxmh.misaSaOrder?.refNo
                    ? `ĐBH: ${dxmh.misaSaOrder.refNo}`
                    : undefined,
                }))}
              />
            )}

            {dxmhId && (
              <p className="mt-1 text-xs text-gray-500">
                {(() => {
                  const selected = dxmhList.find((d) => d.id === dxmhId);
                  if (selected?.misaSaOrder) {
                    return `Đơn bán hàng: ${selected.misaSaOrder.refNo} - ${selected.misaSaOrder.accountObjectName || ""}`;
                  }
                  return null;
                })()}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-400">
              Tìm thấy {dxmhList.length} DXMH trong khoảng thời gian
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Ghi chú nội bộ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Nhập ghi chú..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
