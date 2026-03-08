import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Building } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import Pagination from "../../components/commons/Pagination";
import { departmentApi } from "../../api/departments";
import type { Department } from "../../types/department";
import DepartmentModal from "../../components/DepartmentModal";
import { useLoading } from "../../contexts/LoadingContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
// import { LoadingPage } from "../components/ui/Loading";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { isLoading, showLoading, hideLoading } = useLoading();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [myFactory, setMyFactory] = useState<any>(null);

  // Lấy thông tin nhà máy của Factory Admin
  useEffect(() => {
    const userInfo = localStorage.getItem("user_info");
    const setFromLocal = () => {
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          if (user && user.factory) {
            setMyFactory(user.factory);
            return true;
          }
        } catch (_) {}
      }
      return false;
    };

    const init = async () => {
      const hasLocalFactory = setFromLocal();
      if (!hasLocalFactory) {
        try {
          // Fallback gọi API để lấy nhà máy của user hiện tại
          const { usersApi } = await import("../../api/users");
          const factory = await usersApi.getMyFactory();
          setMyFactory(factory);
        } catch (err) {
          console.error("Không thể lấy thông tin nhà máy:", err);
        }
      }
    };

    void init();
  }, []);

  // Lấy danh sách phòng ban
  const fetchDepartments = async () => {
    if (!myFactory?.id) {
      return;
    }

    try {
      showLoading("Đang tải danh sách phòng ban...");
      setError(null);
      const response = await departmentApi.getAll(myFactory.id);
      setDepartments(response || []);
    } catch (error: any) {
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tải danh sách phòng ban";
      setError(message);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    if (myFactory?.id) {
      fetchDepartments();
    }
  }, [myFactory?.id]);

  // Lọc phòng ban theo từ khóa tìm kiếm
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description &&
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset pagination when data or search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, departments.length]);

  const total = filteredDepartments.length;
  const start = (page - 1) * limit;
  const end = Math.min(start + limit, total);
  const paginatedDepartments = filteredDepartments.slice(start, end);

  // Xử lý tạo phòng ban mới
  const handleCreateDepartment = async (data: {
    name: string;
    description?: string;
    status?: string;
  }) => {
    try {
      await departmentApi.create({
        ...data,
        factoryId: +myFactory.id,
      });
      await fetchDepartments();
      setShowModal(false);
    } catch (error: any) {
      console.error("Error creating department:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tạo phòng ban";
      setError(message);
    }
  };

  // Xử lý cập nhật phòng ban
  const handleUpdateDepartment = async (data: {
    name?: string;
    description?: string;
    status?: string;
  }) => {
    if (!selectedDepartment) return;

    try {
      await departmentApi.update(selectedDepartment.id, data);
      await fetchDepartments();
      setShowModal(false);
      setSelectedDepartment(null);
    } catch (error: any) {
      console.error("Error updating department:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi cập nhật phòng ban";
      setError(message);
    }
  };

  // Xử lý xóa phòng ban
  const handleDeleteDepartment = async (department: Department) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa phòng ban',
      message: `Bạn có chắc chắn muốn xóa phòng ban "${department.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await departmentApi.delete(department.id);
      toast.success('Đã xóa phòng ban thành công!');
      await fetchDepartments();
    } catch (error: any) {
      console.error("Error deleting department:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi xóa phòng ban";
      toast.error(message);
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setModalMode('edit');
    setShowModal(true);
  };

  const getActions = (department: Department) => {
    const actions = [
      {
        label: "Sửa",
        icon: <Edit className="h-4 w-4" />,
        onClick: () => openEditModal(department),
      },
      {
        label: "Xóa",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDeleteDepartment(department),
        variant: "danger" as const,
      },
    ];

    return actions;
  };

  // Dùng global loading overlay, không render loading cục bộ

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            Lỗi tải dữ liệu
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchDepartments()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý Phòng ban</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý các phòng ban trong nhà máy {myFactory?.name}
          </p>
        </div>
        <Button onClick={() => {
          setModalMode('create');
          setShowModal(true);
        }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Thêm phòng ban
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm phòng ban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-border">
          {paginatedDepartments.map((department) => (
            <div key={department.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{department.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{department.description || "-"}</p>
                  <div className="mt-2">
                    <Badge
                      variant={
                        department.status === "active" ? "default" : "secondary"
                      }
                    >
                      {department.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <ActionsDropdown actions={getActions(department)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tên phòng ban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedDepartments.map((department) => (
                <tr
                  key={department.id}
                  className="hover:bg-accent transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {department.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      variant={
                        department.status === "active" ? "default" : "secondary"
                      }
                    >
                      {department.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ActionsDropdown actions={getActions(department)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedDepartments.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu</div>
        )}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Empty State */}
      {filteredDepartments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "Không tìm thấy phòng ban" : "Chưa có phòng ban nào"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Thử thay đổi từ khóa tìm kiếm"
              : "Bắt đầu bằng cách tạo phòng ban đầu tiên"}
          </p>
          {!searchTerm && (
            <Button onClick={() => {
              setModalMode('create');
              setShowModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm phòng ban
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <DepartmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDepartment(null);
        }}
        mode={modalMode}
        department={selectedDepartment}
        onSubmit={async (data) => {
          if (modalMode === 'create') {
            await handleCreateDepartment(data);
          } else {
            await handleUpdateDepartment(data);
          }
        }}
      />
    </div>
  );
}
