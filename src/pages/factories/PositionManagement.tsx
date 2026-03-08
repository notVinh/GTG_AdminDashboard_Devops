import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserCog } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import Pagination from "../../components/commons/Pagination";
import { positionApi } from "../../api/positions";
import { departmentApi } from "../../api/departments";
import type { PositionEmployee, Department } from "../../types/department";
import PositionModal from "../../components/PositionModal";
import { LoadingPage } from "../../components/commons/Loading";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import ErrorMessage from "../../components/commons/ErrorMessage";
import ActionsDropdown from "../../components/commons/ActionsDropdown";

export default function PositionManagement() {
  const { confirm } = useConfirm();
  const toast = useToast();
  const [positions, setPositions] = useState<PositionEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPosition, setSelectedPosition] =
    useState<PositionEmployee | null>(null);
  const [myFactory, setMyFactory] = useState<any>(null);

  // Lấy thông tin nhà máy của Factory Admin
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
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
          const { usersApi } = await import('../../api/users');
          const factory = await usersApi.getMyFactory();
          setMyFactory(factory);
        } catch (err) {
          console.error('Không thể lấy thông tin nhà máy:', err);
        }
      }
    };

    void init();
  }, []);

  // Lấy danh sách phòng ban
  const fetchDepartments = async () => {
    if (!myFactory?.id) return;

    try {
      const response = await departmentApi.getAll(myFactory.id);
      setDepartments(response || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tải danh sách phòng ban";
      setError(message);
    }
  };

  // Lấy danh sách vị trí
  const fetchPositions = async () => {
    if (!myFactory?.id) return;

    try {
      setLoading(true);
      const departmentId =
        selectedDepartmentId === "all"
          ? undefined
          : parseInt(selectedDepartmentId);
      const response = await positionApi.getAll(myFactory.id, departmentId);
      setPositions(response || []);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tải danh sách vị trí";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myFactory?.id) {
      fetchDepartments();
    }
  }, [myFactory?.id]);

  useEffect(() => {
    if (myFactory?.id) {
      fetchPositions();
    }
  }, [myFactory?.id, selectedDepartmentId]);

  // Lọc vị trí theo từ khóa tìm kiếm
  const filteredPositions = positions.filter(
    (position) =>
      position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.department &&
        position.department?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDepartmentId, positions.length]);

  const total = filteredPositions.length;
  const start = (page - 1) * limit;
  const end = Math.min(start + limit, total);
  const paginatedPositions = filteredPositions.slice(start, end);

  // Xử lý tạo vị trí mới
  const handleCreatePosition = async (data: {
    name: string;
    description: string;
    status?: string;
    departmentId: number;
  }) => {
    try {
      await positionApi.create({
        ...data,
        factoryId: +myFactory.id,
      });
      await fetchPositions();
      setShowModal(false);
    } catch (error: any) {
      console.error("Error creating position:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tạo vị trí";
      setError(message);
    }
  };

  // Xử lý cập nhật vị trí
  const handleUpdatePosition = async (data: {
    name?: string;
    description?: string;
    status?: string;
    departmentId?: number;
  }) => {
    if (!selectedPosition) return;

    try {
      await positionApi.update(selectedPosition.id, data);
      await fetchPositions();
      setShowModal(false);
      setSelectedPosition(null);
    } catch (error: any) {
      console.error("Error updating position:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi cập nhật vị trí";
      setError(message);
    }
  };

  // Xử lý xóa vị trí
  const handleDeletePosition = async (position: PositionEmployee) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa vị trí',
      message: `Bạn có chắc chắn muốn xóa vị trí "${position.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await positionApi.delete(position.id);
      toast.success('Đã xóa vị trí thành công!');
      await fetchPositions();
    } catch (error: any) {
      console.error("Error deleting position:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi xóa vị trí";
      toast.error(message);
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (position: PositionEmployee) => {
    setSelectedPosition(position);
    setModalMode('edit');
    setShowModal(true);
  };

  const getActions = (position: PositionEmployee) => {
    const actions = [
      {
        label: "Sửa",
        icon: <Edit className="h-4 w-4" />,
        onClick: () => openEditModal(position),
      },
      {
        label: "Xóa",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDeletePosition(position),
        variant: "danger" as const,
      },
    ];

    return actions;
  };

  if (loading) {
    return <LoadingPage text="Đang tải danh sách vị trí..." />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý Vị trí nhân viên</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý các vị trí nhân viên trong nhà máy {myFactory?.name}
          </p>
        </div>

        <Button onClick={() => {
          setModalMode('create');
          setShowModal(true);
        }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Thêm vị trí
        </Button>
      </div>

      {/* Error Display */}
      {error && (<ErrorMessage error={error} setError={setError} />)}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={selectedDepartmentId}
          onValueChange={setSelectedDepartmentId}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Chọn phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng ban</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Positions Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-border">
          {paginatedPositions.map((position) => (
            <div key={position.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{position.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Phòng ban:</span> {position.department?.name ?? '-'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{position.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={position.status === 'active' ? 'default' : 'secondary'}>
                      {position.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {position.employees?.length ? `${position.employees.length} nhân viên` : '0 nhân viên'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <ActionsDropdown actions={getActions(position)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên vị trí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPositions.map((position) => (
                <tr key={position.id} className="hover:bg-accent transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{position.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{position.department?.name ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {position.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant={position.status === 'active' ? 'default' : 'secondary'}>
                      {position.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {position.employees?.length ? `${position.employees.length} nhân viên` : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ActionsDropdown actions={getActions(position)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedPositions.length === 0 && (
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
      {filteredPositions.length === 0 && !loading && (
        <div className="text-center py-12">
          <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || selectedDepartmentId !== "all"
              ? "Không tìm thấy vị trí nào"
              : "Chưa có vị trí nào"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedDepartmentId !== "all"
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Bắt đầu bằng cách tạo vị trí đầu tiên"}
          </p>
          {!searchTerm && selectedDepartmentId === "all" && (
            <Button onClick={() => {
              setModalMode('create');
              setShowModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm vị trí
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <PositionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPosition(null);
        }}
        mode={modalMode}
        position={selectedPosition}
        departments={departments}
        onSubmit={async (data) => {
          if (modalMode === 'create') {
            await handleCreatePosition(data);
          } else {
            await handleUpdatePosition(data);
          }
        }}
      />
    </div>
  );
}
