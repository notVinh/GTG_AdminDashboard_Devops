import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import { positionApi } from "../../api/positions";
import { teamApi } from "../../api/team";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  UserCheck,
  Eye,
  Users,
  Search,
  Filter,
  Building2,
  CheckCircle,
} from "lucide-react";
import type { EmployeeItem, PositionItem } from "../../types/employee";
import type { Department, Team } from "../../types/department";

export default function MyFactoryDailyProduction() {
  const navigate = useNavigate();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [managerFilter, setManagerFilter] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted) {
          if (me) {
            setFactoryId(Number((me as any).factoryId));
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!factoryId) return;
      setLoading(true);
      try {
        const [employeesList, pos, deps, teamList] = await Promise.all([
          employeeApi.getEmployeesBySalaryType(factoryId, "production"),
          positionApi.getAll(factoryId),
          departmentApi.getAll(factoryId),
          teamApi.getAll(factoryId),
        ]);
        setEmployees(employeesList);
        setPositions(pos);
        setDepartments(deps || []);
        setTeams(teamList || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId]);

  const filteredEmployees = employees.filter((employee) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        employee.user?.fullName?.toLowerCase().includes(search) ||
        employee.user?.phone?.includes(search) ||
        employee.position?.name?.toLowerCase().includes(search) ||
        employee.department?.name?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Department filter
    const deptId =
      (employee as any).position?.departmentId ??
      (employee as any).department?.id;
    const matchesDepartment =
      !departmentFilter || String(deptId ?? "") === String(departmentFilter);
    if (!matchesDepartment) return false;

    // Team filter
    const matchesTeam =
      !teamFilter ||
      String((employee as any).teamId ?? "") === String(teamFilter);
    if (!matchesTeam) return false;

    // Position filter
    const matchesPosition =
      !positionFilter || String(employee.positionId) === String(positionFilter);
    if (!matchesPosition) return false;

    // Status filter
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    if (!matchesStatus) return false;

    // Manager filter
    const matchesManager =
      !managerFilter ||
      String(employee.isManager ?? false) === String(managerFilter);
    if (!matchesManager) return false;

    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h1 className="text-lg sm:text-2xl font-bold">
          Công nhân lương theo sản lượng
        </h1>
      </div>

      {/* Search and Expandable Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập tên công nhân cần tìm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 xl:ml-auto">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ẩn bộ lọc" : "Lọc"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        // Reset vị trí và tổ khi đổi phòng ban
                        setPositionFilter("");
                        setTeamFilter("");
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Tất cả phòng ban</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
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
                            String(t.departmentId) === String(departmentFilter),
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Tất cả vị trí</option>
                      {positions
                        .filter(
                          (p) =>
                            !departmentFilter ||
                            String((p as any).departmentId) ===
                              String(departmentFilter),
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="Cộng tác">Cộng tác</option>
                      <option value="Thử việc">Thử việc</option>
                      <option value="Chính thức">Chính thức</option>
                      <option value="Nghỉ việc">Nghỉ việc</option>
                    </select>
                  </div>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={managerFilter}
                      onChange={(e) => setManagerFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                    >
                      <option value="">Là quản lý hay không</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Display */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Đang tải danh sách công nhân...</div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              {searchTerm
                ? "Không tìm thấy công nhân phù hợp"
                : "Không có công nhân lương theo sản lượng"}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b">
              <h2 className="text-base sm:text-lg font-semibold">
                Danh sách công nhân lương theo sản lượng
              </h2>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {employee.user?.fullName || "-"}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Vị trí:</span>{" "}
                          {employee.position?.name || "-"}
                        </div>
                        <div>
                          <span className="text-gray-500">Phòng ban:</span>{" "}
                          {employee.department?.name || "-"}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge
                          variant={
                            employee.status === "Chính thức"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {employee.status || "-"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/nha-may-cua-toi/san-luong/${employee.id}`)
                    }
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết sản lượng
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Công nhân
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vị trí
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {employee.user?.fullName
                                  ?.charAt(0)
                                  .toUpperCase() || "-"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.user?.fullName || "-"}
                            </div>
                            <div className="text-sm text-gray-500">
                              <Badge variant="secondary" className="text-xs">
                                Lương theo sản lượng
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/nha-may-cua-toi/chi-tiet-san-xuat/${employee.id}`,
                            )
                          }
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filteredEmployees.length && (
              <div className="p-8 text-center text-gray-500">
                Không có công nhân nào
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
