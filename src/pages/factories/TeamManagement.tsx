import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import Pagination from "../../components/commons/Pagination";
import { teamApi } from "../../api/team";
import { departmentApi } from "../../api/departments";
import type { Team, Department } from "../../types/department";
import TeamModal from "../../components/TeamModal";
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

export default function TeamManagement() {
  const { confirm } = useConfirm();
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
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

  // Lấy danh sách tổ
  const fetchTeams = async () => {
    if (!myFactory?.id) return;

    try {
      setLoading(true);
      const response = await teamApi.getAll(myFactory.id);
      setTeams(response || []);
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tải danh sách tổ";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myFactory?.id) {
      fetchDepartments();
      fetchTeams();
    }
  }, [myFactory?.id]);

  // Lọc tổ theo từ khóa tìm kiếm và filters
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.department?.name && team.department.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment =
      selectedDepartmentId === "all" ||
      team.departmentId?.toString() === selectedDepartmentId;

    return matchesSearch && matchesDepartment;
  });

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDepartmentId, teams.length]);

  const total = filteredTeams.length;
  const start = (page - 1) * limit;
  const end = Math.min(start + limit, total);
  const paginatedTeams = filteredTeams.slice(start, end);

  // Xử lý tạo tổ mới
  const handleCreateTeam = async (data: {
    name: string;
    description?: string;
    status?: string;
    departmentId: number;
  }) => {
    try {
      await teamApi.create({
        ...data,
        factoryId: +myFactory.id,
      });
      toast.success('Tạo tổ thành công!');
      await fetchTeams();
      setShowModal(false);
    } catch (error: any) {
      console.error("Error creating team:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tạo tổ";
      throw new Error(message);
    }
  };

  // Xử lý cập nhật tổ
  const handleUpdateTeam = async (data: {
    name?: string;
    description?: string;
    status?: string;
  }) => {
    if (!selectedTeam) return;

    try {
      await teamApi.update(selectedTeam.id, data);
      toast.success('Cập nhật tổ thành công!');
      await fetchTeams();
      setShowModal(false);
      setSelectedTeam(null);
    } catch (error: any) {
      console.error("Error updating team:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi cập nhật tổ";
      throw new Error(message);
    }
  };

  // Xử lý xóa tổ
  const handleDeleteTeam = async (team: Team) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa tổ',
      message: `Bạn có chắc chắn muốn xóa tổ "${team.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await teamApi.delete(team.id);
      toast.success('Đã xóa tổ thành công!');
      await fetchTeams();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi xóa tổ";
      toast.error(message);
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setModalMode('edit');
    setShowModal(true);
  };

  const getActions = (team: Team) => {
    const actions = [
      {
        label: "Sửa",
        icon: <Edit className="h-4 w-4" />,
        onClick: () => openEditModal(team),
      },
      {
        label: "Xóa",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDeleteTeam(team),
        variant: "danger" as const,
      },
    ];

    return actions;
  };

  if (loading) {
    return <LoadingPage text="Đang tải danh sách tổ..." />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý Tổ</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý các tổ trong nhà máy {myFactory?.name}
          </p>
        </div>

        <Button onClick={() => {
          setModalMode('create');
          setShowModal(true);
        }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Thêm tổ
        </Button>
      </div>

      {/* Error Display */}
      {error && (<ErrorMessage error={error} setError={setError} />)}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm tổ..."
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

      {/* Teams Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-border">
          {paginatedTeams.map((team) => (
            <div key={team.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{team.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Phòng ban:</span> {team.department?.name ?? '-'}
                  </p>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {team.employees?.length ? `${team.employees.length} nhân viên` : '0 nhân viên'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <ActionsDropdown actions={getActions(team)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên tổ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTeams.map((team) => (
                <tr key={team.id} className="hover:bg-accent transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{team.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{team.department?.name ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {team.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {team.employees?.length ? `${team.employees.length} nhân viên` : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ActionsDropdown actions={getActions(team)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedTeams.length === 0 && (
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
      {filteredTeams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || selectedDepartmentId !== "all"
              ? "Không tìm thấy tổ nào"
              : "Chưa có tổ nào"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedDepartmentId !== "all"
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Bắt đầu bằng cách tạo tổ đầu tiên"}
          </p>
          {!searchTerm && selectedDepartmentId === "all" && (
            <Button onClick={() => {
              setModalMode('create');
              setShowModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm tổ
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <TeamModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTeam(null);
        }}
        mode={modalMode}
        team={selectedTeam}
        departments={departments}
        onSubmit={async (data) => {
          if (modalMode === 'create') {
            await handleCreateTeam(data);
          } else {
            await handleUpdateTeam(data);
          }
        }}
      />
    </div>
  );
}
