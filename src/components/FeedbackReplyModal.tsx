import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { employeeFeedbackApi } from "../api/employee-feedback";
import { FeedbackStatus, type EmployeeFeedback } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface FeedbackReplyModalProps {
  feedback: EmployeeFeedback;
  employeeId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeedbackReplyModal({
  feedback,
  employeeId,
  onClose,
  onSuccess,
}: FeedbackReplyModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>(FeedbackStatus.REPLIED as FeedbackStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!replyContent.trim()) {
      setError("Vui lòng nhập nội dung phản hồi");
      return;
    }

    if (!employeeId) {
      setError("Không xác định được thông tin người phản hồi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await employeeFeedbackApi.update(feedback.id, {
        replyContent: replyContent.trim(),
        repliedByEmployeeId: employeeId,
        status,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi gửi phản hồi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Phản hồi Góp ý</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Feedback Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{feedback.title}</h3>
            <p className="text-sm text-gray-600">
              Từ: <strong>{feedback.employee?.user?.fullName || "Ẩn danh"}</strong>
            </p>
            <p className="text-sm text-gray-700 mt-2 line-clamp-3">
              {feedback.content}
            </p>
          </div>

          {/* Reply Content */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nội dung phản hồi <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập nội dung phản hồi..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Status Selection */}
          <div className="hidden">
            <label className="text-sm font-medium mb-2 block">
              Trạng thái sau khi phản hồi
            </label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as FeedbackStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="replied">Đã phản hồi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
