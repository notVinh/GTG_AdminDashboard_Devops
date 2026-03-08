import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { EmployeeFeedback, FeedbackStatus } from "../types";
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

interface FeedbackDetailModalProps {
  feedback: EmployeeFeedback;
  onClose: () => void;
  onStatusChange?: (status: FeedbackStatus) => void;
  onReply?: () => void;
}

export default function FeedbackDetailModal({
  feedback,
  onClose,
  onStatusChange,
  onReply,
}: FeedbackDetailModalProps) {
  const getStatusLabel = (status: FeedbackStatus) => {
    const labels = {
      pending: "Chờ xử lý",
      replied: "Đã phản hồi",
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      urgent: "Khẩn cấp",
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Chi tiết Góp ý</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <label className="text-sm font-medium text-gray-500">Người gửi</label>
              <p className="text-base font-semibold">
                {feedback.employee?.user.fullName || "Ẩn danh"}
              </p>
              {feedback.employee?.department && (
                <p className="text-sm text-gray-600">
                  {feedback.employee.department?.name || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày gửi</label>
              <p className="text-base">
                {new Date(feedback.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Trạng thái</label>
              <div className="mt-1">
                <Badge variant="default">{getStatusLabel(feedback.status)}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Mức độ ưu tiên</label>
              <p className="text-base font-medium">
                {getPriorityLabel(feedback.priority)}
              </p>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{feedback.title}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{feedback.content}</p>
            </div>
          </div>

          {/* Attachments */}
          {feedback.attachments && feedback.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">
                File đính kèm
              </label>
              <div className="space-y-2">
                {feedback.attachments.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline"
                  >
                    Xem file {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reply Content */}
          {feedback.replyContent && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500 mb-2 block">
                Phản hồi
              </label>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {feedback.replyContent}
                </p>
                {feedback.repliedByEmployee && (
                  <p className="text-sm text-gray-500 mt-2">
                    Phản hồi bởi:{" "}
                    <strong>{feedback.repliedByEmployee.user?.fullName || '-'}</strong>
                    {feedback.repliedAt && (
                      <span className="ml-2">
                        ({new Date(feedback.repliedAt).toLocaleString("vi-VN")})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            {onStatusChange && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Thay đổi trạng thái
                </label>
                <Select
                  value={feedback.status}
                  onValueChange={(v) => onStatusChange(v as FeedbackStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="replied">Đã phản hồi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-6">
              {onReply && feedback.status === "pending" && (
                <Button onClick={onReply}>Phản hồi</Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
