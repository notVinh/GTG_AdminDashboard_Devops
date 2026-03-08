import { useState } from "react";
import { RefreshCw, Truck, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { misaDataSourceApi, type MisaPuOrder } from "../api/misa-data-source";

interface PuOrderConfirmArrivalModalProps {
  open: boolean;
  order: MisaPuOrder | null;
  onClose: () => void;
  onSuccess: (updatedOrder: MisaPuOrder, message: string) => void;
  onError: (message: string) => void;
}

export default function PuOrderConfirmArrivalModal({
  open,
  order,
  onClose,
  onSuccess,
  onError,
}: PuOrderConfirmArrivalModalProps) {
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!order) return;

    setConfirming(true);
    try {
      const result = await misaDataSourceApi.confirmPuOrderArrival(
        order.id,
        notes || undefined
      );

      if (result.success && result.order) {
        onSuccess(result.order, result.message || "Xác nhận hàng về thành công");
        handleClose();
      } else {
        onError(result.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      onError(error.message || "Có lỗi xảy ra khi xác nhận");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận hàng về - {order?.refNo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Truck className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">
              Xác nhận hàng của đơn <strong>{order?.refNo}</strong> đã về?
            </span>
          </div>

          <div>
            <Label htmlFor="confirmNotes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="confirmNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Nhập ghi chú nếu có..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={confirming}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-green-600 hover:bg-green-700"
          >
            {confirming ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
