import { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Phone,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  X,
  Building2,
  UserCheck,
  Filter,
  Users,
} from "lucide-react";
import { zaloApi } from "../../api/zalo";
import { LoadingTable } from "../../components/commons/Loading";
import type {
  ZaloMessage,
  SendMessageToUsersResponse,
  EmployeeWithDetails,
} from "../../types";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import { teamApi } from "../../api/team";
import { usersApi } from "../../api/users";
import type { Department, Team } from "../../types/department";
import ErrorMessage from "../../components/commons/ErrorMessage";
import { useToast } from "../../contexts/ToastContext";

type Employee = EmployeeWithDetails;

interface Factory {
  id: number;
  name: string;
  address: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export default function MessageManagement() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(
    new Set()
  );
  const [messageContent, setMessageContent] = useState("");
  const [showPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // Message type selection
  const [messageType, setMessageType] = useState<"text" | "file">("text");

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"payroll" | "document">("document");
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null>(null);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [managerFilter, setManagerFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [factory, setFactory] = useState<Factory | null>(null);
  const [sentMessages] = useState<ZaloMessage[]>([]);
  const [zaloOA, setZaloOA] = useState<any>(null);

  // Loading states
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] =
    useState<SendMessageToUsersResponse | null>(null);

  // Error boundary state
  const [hasError, setHasError] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setHasError(false);

      // Load factory info
      const factoryData = await usersApi.getMyFactory();
      setFactory(factoryData);

      // Load employees
      setLoadingEmployees(true);
      const employeesData = await employeeApi.listEmployeesWithDetails(
        1,
        100,
        factoryData.id
      );
      setEmployees(employeesData.data || []);

      // Load departments
      try {
        const deps = await departmentApi.getAll(+factoryData.id);
        setDepartments(deps || []);
      } catch (_) {
        setDepartments([]);
      }

      // Load teams
      try {
        const teamList = await teamApi.getAll(+factoryData.id);
        setTeams(teamList || []);
      } catch (_) {
        setTeams([]);
      }

      // Load Zalo OA info
      try {
        const zaloOAData = await zaloApi.getMyZaloOA();
        setZaloOA(zaloOAData);
      } catch (err) {
        console.warn("Zalo OA not configured:", err);
        setZaloOA(null);
      }


      // Load sent messages
      setLoadingMessages(true);
      // try {
      //   const messagesData = await zaloApi.getMessageHistory(1, 10);
      //   setSentMessages(messagesData.data);
      // } catch (err) {
      //   console.warn('Failed to load messages:', err);
      //   setSentMessages([]);
      // }
    } catch (err: any) {
      console.error("Error loading data:", err);
      const message = err?.message || err?.data?.errors?.message || "Có lỗi xảy ra khi tải dữ liệu";
      setError(message);
      setHasError(true);
    } finally {
      setLoadingEmployees(false);
      setLoadingMessages(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    // Kiểm tra emp và các thuộc tính cần thiết
    if (!emp || !emp.user || !emp.position) {
      return false;
    }

    const matchesSearch = (
      emp.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user.phone?.includes(searchTerm) ||
      emp.position?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm === ""
    );

    const deptId = (emp as any).position?.departmentId || (emp as any).department?.id;
    const matchesDepartment = !departmentFilter || String(deptId ?? "") === String(departmentFilter);
    const matchesTeam = !teamFilter || String((emp as any).teamId ?? "") === String(teamFilter);
    const matchesManager = !managerFilter || String(emp.isManager ?? false) === String(managerFilter);

    return matchesSearch && matchesDepartment && matchesTeam && matchesManager;
  });

  const handleSelectEmployee = (userId: number) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(
        new Set(filteredEmployees.map((emp) => emp.user.id))
      );
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Hiển thị file ngay lập tức
      setUploadedFile({
        fileUrl: '', // Sẽ được cập nhật khi upload
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    }
  };


  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const generatePreview = (content: string, employee: Employee) => {
    try {
      return content
        .replace(/{name}/g, employee?.user?.fullName || "Nhân viên")
        .replace(/{factory}/g, factory?.name || "Nhà máy")
        .replace(/{time}/g, new Date().toLocaleTimeString("vi-VN"))
        .replace(/{date}/g, new Date().toLocaleDateString("vi-VN"));
    } catch (err) {
      console.error("Error generating preview:", err);
      return content;
    }
  };

  const handleSendMessage = async () => {
    if (messageType === "text" && (selectedEmployees.size === 0 || !messageContent.trim())) {
      showToast("Vui lòng chọn nhân viên và nhập nội dung tin nhắn", "error");
      return;
    }

    if (messageType === "file" && !selectedFile) {
      showToast("Vui lòng upload file trước khi gửi tin nhắn kèm file", "error");
      return;
    }

    if (!factory) {
      showToast("Không tìm thấy thông tin nhà máy", "error");
      return;
    }

    if (!zaloOA) {
      showToast("Zalo OA chưa được cấu hình. Vui lòng liên hệ quản trị viên.", "error");
      return;
    }

    setSending(true);
    setError(null);
    setSendResult(null);

    try {
      let result;

      if (messageType === "file") {
        // Upload file trước khi gửi tin nhắn
        if (!selectedFile) {
          showToast("Vui lòng chọn file để gửi", "error");
          return;
        }

        if (!zaloOA || !zaloOA.accessToken) {
          showToast("Zalo OA chưa được cấu hình hoặc thiếu access token", "error");
          return;
        }

        // Upload file và lấy file token
        const uploadResult = await zaloApi.uploadFile(selectedFile, zaloOA.accessToken);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Upload file thất bại');
        }

        // Gửi tin nhắn kèm file với file token
        result = await zaloApi.sendMessageWithFile({
          userIds: Array.from(selectedEmployees),
          fileToken: uploadResult.fileToken,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType,
          fileSize: uploadResult.fileSize,
          factoryId: factory.id,
        });
      } else {
        // Gửi tin nhắn văn bản thông thường
        result = await zaloApi.sendMessageToUsers({
          userIds: Array.from(selectedEmployees),
          message: messageContent,
          factoryId: factory.id,
        });
      }

      setSendResult(result);

      if (result.successCount > 0) {
        // TODO: success toast

        // Reset form
        setSelectedEmployees(new Set());
        setMessageContent("");
        setSelectedFile(null);
        setUploadedFile(null);
        setMessageType("text");
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        // Reload messages
        loadData();
      } else {
        // TODO: error toast
      }
    } catch (err: any) {
      const message = err?.message || err?.data?.errors?.message || "Có lỗi xảy ra khi gửi tin nhắn";
      setError(message);
      // TODO: error toast
    } finally {
      setSending(false);
    }
  };

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Đã xảy ra lỗi
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              loadData();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Gửi tin nhắn Zalo</h1>
      </div>

      {/* Error Display */}
      {error && (<ErrorMessage error={error} setError={setError} />)}

      {/* Factory Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Nhà máy:</span>
          <span className="font-medium">{factory?.name || "Đang tải..."}</span>
          <span className="text-sm text-gray-500">
            ({factory?.address || ""})
          </span>
        </div>
        {zaloOA ? (
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">
              Zalo OA: {zaloOA.oaName}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">
              Zalo OA chưa được cấu hình
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Employee Selection */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chọn nhân viên</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  Lọc
                </button>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedEmployees.size === filteredEmployees.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập tên nhân viên cần tìm ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        setTeamFilter("");
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Tất cả phòng ban</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Tất cả tổ</option>
                      {teams
                        .filter(
                          (t) =>
                            !departmentFilter ||
                            String(t.departmentId) === String(departmentFilter)
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={managerFilter}
                      onChange={(e) => setManagerFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Tất cả</option>
                      <option value="true">Quản lý</option>
                      <option value="false">Nhân viên</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Employee List - Flat */}
            <div className="max-h-64 overflow-y-auto divide-y rounded-lg border border-gray-200">
              {loadingEmployees ? (
                <LoadingTable text="Đang tải danh sách nhân viên..." />
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy nhân viên nào
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.user.id}
                    onClick={() => handleSelectEmployee(emp.user.id)}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      selectedEmployees.has(emp.user.id)
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(emp.user.id)}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{emp.user?.fullName || '-'}</span>
                            {emp.isManager && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Quản lý
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {emp.position?.name || "—"}
                            {" • "}
                            {(emp as any).department?.name || "—"}
                          </div>
                          <div className="text-xs text-gray-500">Trạng thái: {emp.status}</div>
                          {emp.user.zaloUserId && (
                            <div className="text-xs text-green-600">✓ Đã kết nối Zalo</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-4 w-4" />
                        <span>{emp.user?.phone || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Đã chọn: {selectedEmployees.size} / {filteredEmployees.length}{" "}
              nhân viên
            </div>
          </div>
        </div>

        {/* Right Column - Message Composition */}
        <div className="space-y-4">
          {/* Message Type Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Loại tin nhắn</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="messageType"
                  value="text"
                  checked={messageType === "text"}
                  onChange={(e) =>
                    setMessageType(e.target.value as "text" | "file")
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Tin nhắn văn bản</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="messageType"
                  value="file"
                  checked={messageType === "file"}
                  onChange={(e) =>
                    setMessageType(e.target.value as "text" | "file")
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Tin nhắn kèm file</span>
                </div>
              </label>
            </div>
          </div>

          {/* File Upload Section - Only show when file type is selected */}
          {messageType === "file" && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">File đính kèm</h3>

              {!uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại file
                      </label>
                      <select
                        value={fileType}
                        onChange={(e) =>
                          setFileType(e.target.value as "payroll" | "document")
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="document">Tài liệu chung</option>
                        <option value="payroll">Bảng chấm công</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn file
                      </label>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRemoveFile}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-sm text-green-800">
                        {uploadedFile?.fileName || selectedFile?.name}
                      </div>
                      <div className="text-xs text-green-600">
                        {uploadedFile?.fileSize 
                          ? `${(uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB` 
                          : selectedFile 
                            ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                            : '0 MB'
                        } -{" "}
                        {fileType === "payroll"
                          ? "Bảng chấm công"
                          : "Tài liệu chung"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Xóa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          {messageType === "text" && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Nội dung tin nhắn</h3>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Nhập nội dung tin nhắn..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSendMessage}
              disabled={
                sending ||
                selectedEmployees.size === 0 ||
                (messageType === "text" && !messageContent.trim()) ||
                (messageType === "file" && !selectedFile)
              }
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi tin nhắn
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          {showPreview && selectedEmployees.size > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Xem trước tin nhắn</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {Array.from(selectedEmployees)
                  .slice(0, 3)
                  .map((userId) => {
                    const emp = employees.find((e) => e.user.id === userId);
                    if (!emp) return null;
                    return (
                      <div key={userId} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-1">
                          {emp.user?.fullName || '-'}
                        </div>
                        <div className="text-sm text-gray-700">
                          {generatePreview(messageContent, emp)}
                        </div>
                        {messageType === "file" && (uploadedFile || selectedFile) && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                            <File className="h-3 w-3" />
                            <span>File đính kèm: {uploadedFile?.fileName || selectedFile?.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                {selectedEmployees.size > 3 && (
                  <div className="text-sm text-gray-500 text-center">
                    ... và {selectedEmployees.size - 3} nhân viên khác
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Send Result */}
          {sendResult && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">
                Kết quả gửi tin nhắn
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tổng số người nhận:</span>
                  <span className="font-medium">{sendResult.totalUsers}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Gửi thành công:</span>
                  <span className="font-medium">{sendResult.successCount}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Gửi thất bại:</span>
                  <span className="font-medium">{sendResult.failedCount}</span>
                </div>
              </div>
              {sendResult.results.length > 0 && (
                <div className="mt-4 max-h-32 overflow-y-auto">
                  <div className="text-sm font-medium mb-2">Chi tiết:</div>
                  {sendResult.results.map((result, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 bg-gray-50 rounded mb-1"
                    >
                      <div className="font-medium">{result.fullName}</div>
                      <div className="text-gray-600">{result.phone}</div>
                      <div
                        className={`${
                          result.status === "sent"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {result.status === "sent"
                          ? "✓ Thành công"
                          : `✗ ${result.error}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sent Messages History */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Tin nhắn đã gửi</h3>
        {loadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">
              Đang tải lịch sử tin nhắn...
            </span>
          </div>
        ) : sentMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có tin nhắn nào được gửi
          </div>
        ) : (
          <div className="space-y-3">
            {sentMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">
                      {msg.templateName || "Tin nhắn tùy chỉnh"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {msg.totalRecipients} người nhận
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        msg.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : msg.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : msg.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.status === "sent"
                        ? "Đã gửi"
                        : msg.status === "failed"
                        ? "Thất bại"
                        : msg.status === "pending"
                        ? "Đang gửi"
                        : msg.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(msg.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  {msg.content.length > 100
                    ? `${msg.content.substring(0, 100)}...`
                    : msg.content}
                </div>
                {msg.sentCount > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Thành công: {msg.sentCount} | Thất bại: {msg.failedCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
