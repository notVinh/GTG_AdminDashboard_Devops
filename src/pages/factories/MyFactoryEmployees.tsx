import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Building2,
  UserCheck,
  CheckCircle,
  Eye,
  Trash2,
  FileSpreadsheet,
  UsersRound,
} from "lucide-react";
import { usersApi } from "../../api/users";
import { departmentApi } from "../../api/departments";
import { employeeApi } from "../../api/employee";
import { positionApi } from "../../api/positions";
import { teamApi } from "../../api/team";
import Pagination from "../../components/commons/Pagination";
import EmployeeModal from "../../components/EmployeeModal";
import type { EmployeeItem, PositionItem } from "../../types";
import type { Department, Team } from "../../types/department";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";

export default function MyFactoryEmployees() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [myFactory, setMyFactory] = useState<any>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [workingCount, setWorkingCount] = useState(0);
  const [otherCount, setOtherCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(
    null,
  );
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [managerFilter, setManagerFilter] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        const factory = await usersApi.getMyFactory();
        if (isMounted) {
          setMyFactory(factory);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!myFactory?.id) return;

      try {
        const emp = await employeeApi.listEmployeesWithDetails(
          page,
          limit,
          myFactory.id,
          {
            search: searchTerm || undefined,
            positionId: positionFilter || undefined,
            status: statusFilter || undefined,
            departmentId: departmentFilter || undefined,
            teamId: teamFilter || undefined,
            isManager: managerFilter || undefined,
          },
        );
        if (isMounted) {
          setEmployees(emp.data as EmployeeItem[]);
          setTotal(emp.meta?.total || emp.data.length || 0);
          setWorkingCount(emp.meta?.workingCount || 0);
          setOtherCount(emp.meta?.otherCount || 0);
        }
        const pos = await positionApi.getAll(+myFactory.id);
        const deps = await departmentApi.getAll(+myFactory.id);
        if (isMounted) {
          setPositions(pos);
          setDepartments(deps || []);
        }
      } catch (error) {
        console.error("Error loading employees:", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    myFactory?.id,
    page,
    limit,
    searchTerm,
    positionFilter,
    statusFilter,
    departmentFilter,
    teamFilter,
    managerFilter,
  ]);

  // Load teams when factory loads
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!myFactory?.id) {
        setTeams([]);
        return;
      }
      try {
        const teamList = await teamApi.getAll(+myFactory.id);
        if (isMounted) setTeams(teamList || []);
      } catch (_) {
        if (isMounted) setTeams([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [myFactory?.id]);

  // const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  // reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    positionFilter,
    statusFilter,
    departmentFilter,
    teamFilter,
    managerFilter,
  ]);

  // Check if any filters are active
  const hasActiveFilters =
    departmentFilter !== "" ||
    teamFilter !== "" ||
    positionFilter !== "" ||
    statusFilter !== "" ||
    managerFilter !== "" ||
    searchTerm.trim() !== "";

  const handleDeleteEmployee = async (employee: EmployeeItem) => {
    const confirmed = await confirm({
      title: "Xác nhận xóa nhân viên",
      message: `Bạn có chắc chắn muốn xóa nhân viên "${employee.user?.fullName || "này"}"? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await employeeApi.delete(employee.id);
      toast.success("Đã xóa nhân viên thành công!");
      // Reload employees list with current filters
      if (myFactory?.id) {
        const result = await employeeApi.listEmployeesWithDetails(
          page,
          limit,
          myFactory.id,
          {
            search: searchTerm || undefined,
            positionId: positionFilter || undefined,
            status: statusFilter || undefined,
            departmentId: departmentFilter || undefined,
            teamId: teamFilter || undefined,
            isManager: managerFilter || undefined,
          },
        );
        setEmployees(result.data as EmployeeItem[]);
        setTotal(result.meta?.total || result.data.length || 0);
        setWorkingCount(result.meta?.workingCount || 0);
        setOtherCount(result.meta?.otherCount || 0);
      }
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      const message =
        error?.message ||
        error?.data?.errors?.message ||
        "Có lỗi xảy ra khi xóa nhân viên";
      toast.error(message);
    }
  };

  const getActions = (employee: EmployeeItem) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => navigate(`/nha-may-cua-toi/nhan-vien/${employee.id}`),
      },
      {
        label: "Xóa",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDeleteEmployee(employee),
        variant: "danger" as const,
      },
    ];

    return actions;
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  if (!myFactory) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Không tìm thấy thông tin nhà máy
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý nhân viên</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Quản lý nhân viên trong nhà máy {myFactory?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => navigate("/nha-may-cua-toi/nhan-vien/import")}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button
            onClick={() => navigate("/nha-may-cua-toi/nhan-vien/tao-moi")}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Search and Expandable Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Phòng ban",
              value: departmentFilter,
              onChange: (v: string) => {
                setDepartmentFilter(v);
                setPositionFilter("");
                setTeamFilter("");
              },
              options: [
                { value: "", label: "Tất cả phòng ban" },
                ...departments.map((d) => ({
                  value: d.id.toString(),
                  label: d.name,
                })),
              ],
              icon: <Building2 className="h-4 w-4 text-gray-400" />,
            },
            // Only show team filter if department is selected and has teams
            ...(departmentFilter &&
            teams.filter(
              (t) => String(t.departmentId) === String(departmentFilter),
            ).length > 0
              ? [
                  {
                    type: "select" as const,
                    label: "Tổ",
                    value: teamFilter,
                    onChange: setTeamFilter,
                    options: [
                      { value: "", label: "Tất cả tổ" },
                      ...teams
                        .filter(
                          (t) =>
                            String(t.departmentId) === String(departmentFilter),
                        )
                        .map((t) => ({
                          value: t.id.toString(),
                          label: t.name,
                        })),
                    ],
                    icon: <UsersRound className="h-4 w-4 text-gray-400" />,
                  },
                ]
              : []),
            // Only show position filter if department is selected and has positions
            ...(departmentFilter &&
            positions.filter(
              (p) =>
                String((p as any).departmentId) === String(departmentFilter),
            ).length > 0
              ? [
                  {
                    type: "select" as const,
                    label: "Vị trí",
                    value: positionFilter,
                    onChange: setPositionFilter,
                    options: [
                      { value: "", label: "Tất cả vị trí" },
                      ...positions
                        .filter(
                          (p) =>
                            String((p as any).departmentId) ===
                            String(departmentFilter),
                        )
                        .map((p) => ({
                          value: p.id.toString(),
                          label: p.name,
                        })),
                    ],
                    icon: <Users className="h-4 w-4 text-gray-400" />,
                  },
                ]
              : []),
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "", label: "Tất cả trạng thái" },
                { value: "Cộng tác", label: "Cộng tác" },
                { value: "Thử việc", label: "Thử việc" },
                { value: "Chính thức", label: "Chính thức" },
                { value: "Nghỉ việc", label: "Nghỉ việc" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
            {
              type: "select",
              label: "Quản lý",
              value: managerFilter,
              onChange: setManagerFilter,
              options: [
                { value: "", label: "Là quản lý hay không" },
                { value: "true", label: "Có" },
                { value: "false", label: "Không" },
              ],
              icon: <UserCheck className="h-4 w-4 text-gray-400" />,
            },
          ]}
          gridCols="sm:grid-cols-5"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập tên nhân viên cần tìm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setDepartmentFilter("");
            setTeamFilter("");
            setPositionFilter("");
            setStatusFilter("");
            setManagerFilter("");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-gray-500">Tổng nhân viên</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{workingCount}</div>
              <div className="text-sm text-gray-500">Đang làm việc</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{otherCount}</div>
              <div className="text-sm text-gray-500">Khác</div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold">
            Danh sách nhân viên
          </h2>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {employees.map((employee) => (
            <div key={employee.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {employee.user?.fullName || "-"}
                    </span>
                    {employee.isManager && (
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Quản lý
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-500">Phòng ban:</span>{" "}
                      {employee.department?.name || "-"}
                    </div>
                    <div>
                      <span className="text-gray-500">Vị trí:</span>{" "}
                      {employee.position?.name || "-"}
                    </div>
                    <div>
                      <span className="text-gray-500">SĐT:</span>{" "}
                      {employee.user?.phone || "-"}
                    </div>
                    <div>
                      <span className="text-gray-500">Trạng thái:</span>{" "}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.status === "Chính thức"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {employee.status || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <ActionsDropdown actions={getActions(employee)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{employee.user?.fullName || "-"}</span>
                      {employee.isManager && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Quản lý
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.department?.name || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.position?.name || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.user?.phone || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === "Chính thức"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {employee.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <ActionsDropdown actions={getActions(employee)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!employees.length && (
          <div className="p-8 text-center text-gray-500">
            Không có nhân viên nào
          </div>
        )}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setPage(1); // Reset to first page when limit changes
            setLimit(newLimit);
          }}
        />
      </div>

      <EmployeeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEmployee(null);
        }}
        mode={modalMode}
        employee={editingEmployee}
        positions={positions}
        departments={departments}
        factoryId={myFactory?.id || 0}
        onSubmit={async (data) => {
          if (modalMode === "create") {
            if (!myFactory?.id || !data.fullName || !data.phone) return;
            await employeeApi.createEmployeeWithUser({
              fullName: data.fullName,
              phone: data.phone,
              email: data.email,
              positionId: data.positionId,
              departmentId: data.departmentId || 0,
              salary: data.salary,
              status: data.status,
              salaryType: data.salaryType,
              startDateJob: data.startDateJob,
              endDateJob: data.endDateJob,
              isManager: data.isManager,
              factoryId: +myFactory.id,
            });
          } else {
            if (!editingEmployee) return;
            await employeeApi.updateEmployee(editingEmployee.id, data);
          }

          // Reload employees
          const emp = await employeeApi.listEmployeesWithDetails(
            page,
            limit,
            myFactory.id,
            {
              search: searchTerm || undefined,
              positionId: positionFilter || undefined,
              status: statusFilter || undefined,
              departmentId: departmentFilter || undefined,
              teamId: teamFilter || undefined,
              isManager: managerFilter || undefined,
            },
          );
          setEmployees(emp.data as EmployeeItem[]);
          setTotal(emp.meta?.total || emp.data.length || 0);
          setWorkingCount(emp.meta?.workingCount || 0);
          setOtherCount(emp.meta?.otherCount || 0);
        }}
      />
    </div>
  );
}
