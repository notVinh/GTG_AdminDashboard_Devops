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

interface ApproveDetailModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  children: ReactNode;
  note: string;
  onNoteChange: (value: string) => void;
}

export default function ApproveDetailModal({
  open,
  onClose,
  onConfirm,
  title = "Chi tiết - Duyệt",
  children,
  note,
  onNoteChange,
}: ApproveDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-green-600">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {children}

          {/* Ghi chú duyệt */}
          <div>
            <Label htmlFor="approveNote">Ghi chú duyệt (không bắt buộc)</Label>
            <Textarea
              id="approveNote"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Nhập ghi chú khi duyệt..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700"
          >
            Xác nhận duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
