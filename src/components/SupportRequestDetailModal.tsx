import { X, Check, XCircle, User, Calendar, FileText, Image, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SupportRequest, SupportType } from "../types/support-request";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: SupportRequest | null;
  supportTypes: SupportType[];
  onApprove?: (request: SupportRequest) => void;
  onReject?: (request: SupportRequest) => void;
}

export default function SupportRequestDetailModal({
  isOpen,
  onClose,
  request,
  supportTypes,
  onApprove,
  onReject,
}: Props) {
  const navigate = useNavigate();
  
  if (!isOpen || !request) return null;

  const handleEdit = () => {
    onClose();
    navigate(`/nha-may-cua-toi/bao-ho-tro/tao?id=${request.id}`);
  };

  const getStatusBadgeClass = (status: string) => {
    const config: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return config[status] || config.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chi tiết yêu cầu hỗ trợ</h2>
            <div className="flex items-center gap-2">
              {/* Chỉ hiển thị nút chỉnh sửa nếu đơn chưa bị từ chối hoặc hủy */}
              {(request.status === 'pending' || request.status === 'approved') && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}
              >
                {getStatusLabel(request.status)}
              </span>
            </div>

            {/* Employee Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="font-medium">Thông tin nhân viên</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Họ tên:</span>{" "}
                  <span className="font-medium">
                    {request.employee?.user?.fullName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Phòng ban:</span>{" "}
                  {request.employee?.department?.name || "-"}
                </div>
                <div>
                  <span className="text-gray-500">Chức vụ:</span>{" "}
                  {request.employee?.position?.name || "-"}
                </div>
                <div>
                  <span className="text-gray-500">Ngày yêu cầu:</span>{" "}
                  {formatDate(request.requestDate)}
                </div>
              </div>
            </div>

            {/* Support Items */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="font-medium">Các loại hỗ trợ</span>
              </div>
              <div className="space-y-3">
                {request.items?.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {item.supportType?.name || "N/A"}
                      </span>
                      {item.supportType?.requireQuantity && (
                        <span className="text-sm text-gray-600">
                          Số lượng: {item.quantity} {item.supportType.unit || ""}
                        </span>
                      )}
                    </div>
                    {item.note && (
                      <p className="text-sm text-gray-600 mb-2">
                        Ghi chú: {item.note}
                      </p>
                    )}
                    {item.photoUrls && item.photoUrls.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Image className="h-4 w-4" />
                          Ảnh chứng minh:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.photoUrls.map((url, photoIdx) => (
                            <a
                              key={photoIdx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={url}
                                alt={`Photo ${photoIdx + 1}`}
                                className="h-20 w-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* General Note */}
            {request.note && (
              <div>
                <span className="text-sm text-gray-500">Ghi chú chung:</span>
                <p className="mt-1 text-gray-900">{request.note}</p>
              </div>
            )}

            {/* Approvers */}
            {request.approvers && request.approvers.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 block mb-2">
                  Người duyệt được chỉ định:
                </span>
                <div className="flex flex-wrap gap-2">
                  {request.approvers.map((approver) => (
                    <span
                      key={approver.id}
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {approver.user?.fullName || `#${approver.id}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Info */}
            {request.decidedAt && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-gray-500">Người quyết định:</span>{" "}
                    {request.decidedBy?.user?.fullName || "-"}
                  </div>
                  <div>
                    <span className="text-gray-500">Thời gian:</span>{" "}
                    {formatDateTime(request.decidedAt)}
                  </div>
                  {request.decisionNote && (
                    <div>
                      <span className="text-gray-500">Ghi chú:</span>{" "}
                      {request.decisionNote}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {request.status === "pending" && (onApprove || onReject) && (
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              {onReject && (
                <button
                  onClick={() => {
                    onClose();
                    onReject(request);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => {
                    onClose();
                    onApprove(request);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Duyệt
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
