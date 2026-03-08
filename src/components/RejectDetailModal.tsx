import type { ReactNode } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface RejectDetailModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  children: ReactNode;
  reason: string;
  onReasonChange: (value: string) => void;
  error?: string;
}

export default function RejectDetailModal({
  open,
  onClose,
  onConfirm,
  title = "Chi tiết - Từ chối",
  children,
  reason,
  onReasonChange,
  error,
}: RejectDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-red-600">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {children}

          {/* Lý do từ chối */}
          <div>
            <Label htmlFor="rejectReason">
              Lý do từ chối <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejectReason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={3}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
