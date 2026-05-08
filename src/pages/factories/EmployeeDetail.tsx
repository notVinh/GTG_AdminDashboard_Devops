import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  XCircle,
  Phone,
  Mail,
  CalendarDays,
  Key,
} from "lucide-react";
import { employeeApi } from "../../api/employee";
import type { EmployeeWithDetails } from "../../types/employee";
import EmployeeBasicInfo from "../../components/employee-detail/EmployeeBasicInfo";
import EmployeeRemoteAttendance from "../../components/employee-detail/EmployeeRemoteAttendance";
import EmployeeLeaveRequests from "../../components/employee-detail/EmployeeLeaveRequests";
import EmployeeOvertime from "../../components/employee-detail/EmployeeOvertime";
import EmployeeLeaveDays from "../../components/employee-detail/EmployeeLeaveDays";
import ResetPasswordModal from "../../components/ResetPasswordModal";

type TabType =
  | "basic-info"
  | "remote-attendance"
  | "leave-days"
  | "leave-requests"
  | "overtime";

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: "basic-info", label: "Thông tin cơ bản", icon: User },
  { id: "remote-attendance", label: "Cấu hình chấm công", icon: MapPin },
  { id: "leave-days", label: "Ngày phép", icon: CalendarDays },
  { id: "leave-requests", label: "Đơn xin nghỉ phép", icon: Calendar },
  { id: "overtime", label: "Tăng ca", icon: Clock },
];

const getStatusColor = (status?: string | null) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "chính thức":
      return "bg-green-100 text-green-800";
    case "thử việc":
      return "bg-yellow-100 text-yellow-800";
    case "Cộng tác":
      return "bg-blue-100 text-blue-800";
    case "nghỉ việc":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("basic-info");
  const [error, setError] = useState<string | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) {
        setError("ID nhân viên không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await employeeApi.getEmployeeById(Number(id));
        setEmployee(data);
      } catch (err) {
        console.error("Error fetching employee:", err);
        setError("Không thể tải thông tin nhân viên");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleEmployeeUpdate = (updatedEmployee: EmployeeWithDetails) => {
    setEmployee(updatedEmployee);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin nhân viên...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Không tìm thấy nhân viên"}
          </h2>
          <button
            onClick={() => navigate("/nha-may-cua-toi/nhan-vien")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link
            to="/nha-may-cua-toi/nhan-vien"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại danh sách nhân viên
          </Link>

          {/* Employee Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              {/* Avatar */}
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600" />
              </div>

              {/* Name and Basic Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                    {employee.user?.fullName || "-"}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {employee.isManager && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Quản lý
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}
                    >
                      {employee.status || "Chưa xác định"}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {employee.position?.name || "-"} •{" "}
                  {employee.department?.name || "-"}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {employee.user?.phone || "-"}
                  </span>
                  {employee.user?.email && (
                    <span className="flex items-center break-all">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {employee.user.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetPasswordModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Reset mật khẩu</span>
                <span className="sm:hidden">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 border-b border-gray-200 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                    transition-colors duration-200 flex-shrink-0
                    ${
                      isActive
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "basic-info" && (
          <EmployeeBasicInfo
            employee={employee}
            onUpdate={handleEmployeeUpdate}
          />
        )}
        {activeTab === "remote-attendance" && (
          <EmployeeRemoteAttendance employee={employee} />
        )}
        {activeTab === "leave-days" && (
          <EmployeeLeaveDays
            employee={employee}
            onUpdate={handleEmployeeUpdate}
          />
        )}
        {activeTab === "leave-requests" && (
          <EmployeeLeaveRequests employee={employee} />
        )}
        {activeTab === "overtime" && <EmployeeOvertime employee={employee} />}
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        employeeId={employee.id}
        employeeName={employee.user?.fullName || "-"}
      />
    </div>
  );
};

export default EmployeeDetail;
