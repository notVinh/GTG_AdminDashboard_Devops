import type { LeaveRequest, LeaveSession } from "../types";

interface LeaveDetailContentProps {
  item: LeaveRequest;
  leaveTypeLabel?: (type: string) => string;
}

// Helper: Lấy tên loại nghỉ phép, ưu tiên từ leaveTypeRef
const getLeaveTypeName = (item: LeaveRequest, fallbackFn?: (type: string) => string) => {
  if (item.leaveTypeRef?.name) {
    return item.leaveTypeRef.name;
  }
  // Fallback
  if (fallbackFn) {
    return fallbackFn(item.leaveType);
  }
  return item.leaveType === 'paid' ? 'Có lương' : 'Không lương';
};

export default function LeaveDetailContent({
  item,
  leaveTypeLabel,
}: LeaveDetailContentProps) {
  const leaveSessionLabel = (session: LeaveSession) => {
    switch (session) {
      case "full_day":
        return "Cả ngày";
      case "morning":
        return "Buổi sáng";
      case "afternoon":
        return "Buổi chiều";
      default:
        return "Cả ngày";
    }
  };

  return (
    <>
      {/* Thông tin nhân viên */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Thông tin nhân viên</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-600">Nhân viên</p>
            <p className="font-medium">{item.employee?.user?.fullName || `#${item.employeeId}`}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Người được giao duyệt</p>
            {item.approvers && item.approvers.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.approvers.map((approver) => (
                  <span
                    key={approver.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-sm bg-blue-100 text-blue-800"
                  >
                    {approver.user?.fullName || `#${approver.id}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-medium">{item.approver?.user?.fullName || `#${item.approverEmployeeId}`}</p>
            )}
          </div>
        </div>
        {/* Hiển thị người thực sự duyệt nếu đơn đã được xử lý */}
        {item.decidedBy && (item.status === 'approved' || item.status === 'rejected') && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-gray-600">
              {item.status === 'approved' ? 'Người đã duyệt' : 'Người đã từ chối'}
            </p>
            <p className="font-medium text-green-700">
              {item.decidedBy.user?.fullName || `#${item.decidedByEmployeeId}`}
            </p>
          </div>
        )}
      </div>

      {/* Thông tin nghỉ phép */}
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3">Thông tin nghỉ phép</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-600">Loại phép</p>
            <p className="font-medium">{getLeaveTypeName(item, leaveTypeLabel)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Buổi nghỉ</p>
            <p className="font-medium">{leaveSessionLabel(item.leaveSession)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Số ngày nghỉ</p>
            <p className="font-medium text-lg text-amber-700">{item.totalDays || 0} ngày</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ngày bắt đầu</p>
            <p className="font-medium">{new Date(item.startDate).toLocaleDateString('vi-VN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ngày kết thúc</p>
            <p className="font-medium">{new Date(item.endDate).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Lý do */}
      {item.reason && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Lý do nghỉ phép</h3>
          <p className="text-gray-700">{item.reason}</p>
        </div>
      )}
    </>
  );
}
