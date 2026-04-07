import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Calendar,
} from "lucide-react";
import { generalRequestApi } from "../../api/generalRequest";
import type { GeneralRequest } from "../../types/general-request";
import { Button } from "../../components/ui/button";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { employeeApi } from "../../api/employee";

const STATUS_MAP = {
  pending: {
    label: "Chờ duyệt",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  approved: {
    label: "Đã duyệt",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  },
  rejected: {
    label: "Từ chối",
    color: "text-red-600 bg-red-50",
    icon: XCircle,
  },
};

export default function AdminGeneralRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [request, setRequest] = useState<GeneralRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // useEffect(() => {
  //   const fetchDetail = async () => {
  //     if (!id) return;
  //     try {
  //       setLoading(true);
  //       const data = await generalRequestApi.getDetail(Number(id));
  //       setRequest(data);
  //     } catch (error: any) {
  //       toast?.error(error.message || "Không thể tải chi tiết yêu cầu");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchDetail();
  // }, [id, toast]);

  // Sửa lại useEffect trong AdminGeneralRequestDetail
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await generalRequestApi.getDetail(Number(id));

        // Kiểm tra nếu có ID người duyệt nhưng chưa có tên
        if (data.approverEmployeeId && !data.approver?.name) {
          try {
            const empRes = await employeeApi.getEmployeeById(
              data.approverEmployeeId,
            );
            // Gộp tên vào object data
            data.approver = {
              id: data.approverEmployeeId,
              code: empRes.user?.phone || `NV-${data.approverEmployeeId}`,
              ...data.approver,
              name: empRes.user?.fullName,
            };
          } catch (err) {
            console.error("Không thể fetch tên người duyệt", err);
          }
        }

        setRequest(data);
      } catch (error: any) {
        toast?.error(error.message || "Không thể tải chi tiết yêu cầu");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, toast]);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!request) return;

    const confirmed = await confirm({
      title: status === "approved" ? "Xác nhận duyệt" : "Xác nhận từ chối",
      message: `Bạn có chắc chắn muốn ${status === "approved" ? "duyệt" : "từ chối"} yêu cầu này?`,
      confirmText: status === "approved" ? "Duyệt" : "Từ chối",
      type: status === "approved" ? "success" : "danger",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const updated = await generalRequestApi.reviewRequest(request.id, {
        status,
        decisionNote: "", // Simple review, can extend with input later
      });
      setRequest(updated);
      toast?.success(
        `${status === "approved" ? "Duyệt" : "Từ chối"} thành công`,
      );
    } catch (error: any) {
      toast?.error(error.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Clock className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <div className="text-center text-gray-500">Không tìm thấy yêu cầu</div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[request.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết yêu cầu</h1>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold",
            statusInfo.color,
          )}
        >
          <StatusIcon className="w-4 h-4" />
          {statusInfo.label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Nội dung yêu cầu
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  Tiêu đề
                </label>
                <div className="text-lg font-medium text-gray-900 mt-1">
                  {request.title}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  Nội dung chi tiết
                </label>
                <div className="text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">
                  {request.content}
                </div>
              </div>
            </div>
          </div>

          {request.decisionNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-amber-800">
                Ghi chú phê duyệt
              </h2>
              <div className="text-amber-900">{request.decisionNote}</div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Thông tin liên quan
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Người yêu cầu</div>
                  <div className="font-medium text-gray-900">
                    {request.employee?.user?.fullName || "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg shrink-0">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Người phê duyệt</div>
                  <div className="font-medium text-gray-900">
                    {request.approver?.name || "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ngày tạo</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {request.status === "pending" && (
              <>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview("approved")}
                  disabled={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Duyệt yêu cầu
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleReview("rejected")}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Từ chối yêu cầu
                </Button>
              </>
            )}
            {request.status === "pending" && (
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-red-500"
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "Xác nhận xóa",
                    message: "Bạn có chắc chắn muốn xóa yêu cầu này?",
                    confirmText: "Xóa",
                    type: "danger",
                  });
                  if (confirmed) {
                    try {
                      await generalRequestApi.deleteRequest(request.id);
                      toast?.success("Xóa thành công");
                      navigate(-1);
                    } catch (e: any) {
                      toast?.error(e.message);
                    }
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Hủy & Xóa yêu cầu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
