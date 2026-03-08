import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bulkOvertimeRequestApi } from "../../api/bulk-overtime-request";
import { overtimeCoefficientApi } from "../../api/overtime-coefficient";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import { teamApi } from "../../api/team";
import type { OvertimeCoefficient } from "../../types";
import type { Team } from "../../types/department";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { SelectWithSearch } from "../../components/ui/select-with-search";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { CreateBulkOvertimeRequestDto } from "../../types/bulk-overtime-request";

export default function CreateBulkOvertimeRequest() {
  const navigate = useNavigate();
  const toast = useToast();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [coefficients, setCoefficients] = useState<OvertimeCoefficient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [title, setTitle] = useState("");
  const [approverEmployeeId, setApproverEmployeeId] = useState(0);
  const [overtimeCoefficientId, setOvertimeCoefficientId] = useState(0);
  const [overtimeDate, setOvertimeDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<number | "all">("all");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted) {
          if (me) {
            const fId = Number((me as any).factoryId);
            const eId = Number((me as any).id);
            setFactoryId(fId);
            setEmployeeId(eId);
            setApproverEmployeeId(eId);
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!factoryId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [empList, deptList, coeffList] = await Promise.all([
          employeeApi.getByFactory(factoryId),
          departmentApi.getByFactory(factoryId),
          overtimeCoefficientApi.getByFactory(factoryId),
        ]);
        setEmployees(empList);
        setDepartments(deptList);
        setCoefficients(coeffList);

        // Load teams
        try {
          const teamList = await teamApi.getAll(+factoryId);
          setTeams(teamList || []);
        } catch (_) {
          setTeams([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [factoryId]);

  // Filter employees by department, team and search query
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => Number(emp.departmentId) === Number(departmentFilter));
    }

    // Filter by team
    if (teamFilter) {
      filtered = filtered.filter((emp) => String((emp as any).teamId ?? "") === String(teamFilter));
    }

    // Filter by search query (name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((emp) => {
        const fullName = emp.user?.fullName?.toLowerCase() || "";
        const phone = emp.user?.phone?.toLowerCase() || "";
        return fullName.includes(query) || phone.includes(query);
      });
    }

    return filtered;
  }, [employees, departmentFilter, teamFilter, searchQuery]);

  // Filter managers only for approver dropdown
  const managers = useMemo(() => {
    return employees.filter((emp) => emp.isManager === true);
  }, [employees]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề";
    }
    if (selectedEmployeeIds.length === 0) {
      errors.employees = "Vui lòng chọn ít nhất 1 nhân viên";
    }
    if (!approverEmployeeId) {
      errors.approverEmployeeId = "Vui lòng chọn người duyệt";
    }
    if (!overtimeCoefficientId) {
      errors.overtimeCoefficientId = "Vui lòng chọn hệ số làm thêm";
    }
    if (!overtimeDate) {
      errors.overtimeDate = "Vui lòng chọn ngày tăng ca";
    }
    if (!startTime) {
      errors.startTime = "Vui lòng nhập giờ bắt đầu";
    }
    if (!endTime) {
      errors.endTime = "Vui lòng nhập giờ kết thúc";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm() || !factoryId) return;

    try {
      setLoading(true);
      const payload: CreateBulkOvertimeRequestDto = {
        factoryId,
        title,
        approverEmployeeId: Number(approverEmployeeId),
        overtimeCoefficientId: Number(overtimeCoefficientId),
        employeeIds: selectedEmployeeIds.map((id) => Number(id)),
        overtimeDate,
        startTime,
        endTime,
        reason: reason || undefined,
      };

      await bulkOvertimeRequestApi.create(payload);
      toast.success("Đã tạo đơn tăng ca hàng loạt thành công!");
      navigate("/nha-may-cua-toi/quan-ly-tang-ca-hang-loat");
    } catch (error) {
      console.error("Error creating bulk overtime request:", error);
      toast.error("Có lỗi xảy ra khi tạo đơn");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId: number) => {
    const numId = Number(employeeId);
    setSelectedEmployeeIds((prev) =>
      prev.includes(numId)
        ? prev.filter((id) => id !== numId)
        : [...prev, numId]
    );
  };

  const toggleAll = () => {
    const filteredIds = filteredEmployees.map((emp) => Number(emp.id));
    const allFilteredSelected = filteredIds.every((id) => selectedEmployeeIds.includes(id));

    if (allFilteredSelected) {
      // Deselect all filtered employees
      setSelectedEmployeeIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered employees (keep other selected employees)
      setSelectedEmployeeIds((prev) => {
        const uniqueIds = new Set([...prev, ...filteredIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  const isAllSelected = filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployeeIds.includes(Number(emp.id)));

  if (loading && !factoryId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/nha-may-cua-toi/quan-ly-tang-ca-hang-loat")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Tạo đơn tăng ca hàng loạt</h1>
        <p className="text-gray-600 mt-1">
          Tạo đơn tăng ca cho nhiều nhân viên cùng lúc
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn tăng ca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tăng ca tháng 10/2025 - Phòng Sản Xuất"
            />
            {formErrors.title && (
              <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="approverEmployeeId">
                Người duyệt <span className="text-red-500">*</span>
              </Label>
              <SelectWithSearch
                value={approverEmployeeId > 0 ? approverEmployeeId.toString() : undefined}
                onChange={(v) => setApproverEmployeeId(Number(v))}
                placeholder="Chọn người duyệt"
                options={managers.map((emp: any) => ({
                  value: emp.id.toString(),
                  label: emp.user?.fullName || `#${emp.id}`,
                }))}
              />
              {formErrors.approverEmployeeId && (
                <p className="text-sm text-red-500 mt-1">{formErrors.approverEmployeeId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="overtimeDate">
                Ngày tăng ca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="overtimeDate"
                type="date"
                value={overtimeDate}
                onChange={(e) => setOvertimeDate(e.target.value)}
              />
              {formErrors.overtimeDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.overtimeDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="text"
                placeholder="HH:MM (VD: 18:00)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-2"
              />
              {formErrors.startTime && (
                <p className="text-sm text-red-500 mt-1">{formErrors.startTime}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endTime">
                Giờ kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="text"
                placeholder="HH:MM (VD: 22:00)"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-2"
              />
              {formErrors.endTime && (
                <p className="text-sm text-red-500 mt-1">{formErrors.endTime}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="overtimeCoefficientId">
              Hệ số làm thêm <span className="text-red-500">*</span>
            </Label>
            <Select
              value={overtimeCoefficientId > 0 ? overtimeCoefficientId.toString() : undefined}
              onValueChange={(v) => setOvertimeCoefficientId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn hệ số làm thêm" />
              </SelectTrigger>
              <SelectContent>
                {coefficients
                  .filter((c) => c.isActive)
                  .map((coef) => (
                    <SelectItem key={coef.id} value={coef.id.toString()}>
                      {coef.shiftName} - {coef.coefficient}%
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {formErrors.overtimeCoefficientId && (
              <p className="text-sm text-red-500 mt-1">{formErrors.overtimeCoefficientId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Lý do</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do tăng ca..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chọn nhân viên</CardTitle>
            <div className="text-sm text-gray-600">
              Đã chọn: {selectedEmployeeIds.length}/{filteredEmployees.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departmentFilter" className="text-sm">
                Lọc theo phòng ban:
              </Label>
              <Select
                value={departmentFilter.toString()}
                onValueChange={(v) => {
                  setDepartmentFilter(v === "all" ? "all" : Number(v));
                  setTeamFilter("");
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Tất cả phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban ({employees.length} nhân viên)</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="teamFilter" className="text-sm">
                Lọc theo tổ:
              </Label>
              <Select
                value={teamFilter}
                onValueChange={(v) => setTeamFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Tất cả tổ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tổ</SelectItem>
                  {teams
                    .filter((team) => departmentFilter === "all" || Number(team.departmentId) === Number(departmentFilter))
                    .map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="searchQuery" className="text-sm">
                Tìm kiếm nhân viên:
              </Label>
              <Input
                id="searchQuery"
                type="text"
                placeholder="Nhập tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {(searchQuery || departmentFilter !== "all" || teamFilter) && (
            <div className="text-sm text-gray-600">
              Hiển thị {filteredEmployees.length} / {employees.length} nhân viên
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-auto max-h-[450px]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left w-16 bg-gray-50">
                      <Checkbox
                        id="select-all"
                        checked={isAllSelected}
                        onCheckedChange={toggleAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px] bg-gray-50">
                      Họ và tên
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[120px] bg-gray-50">
                      Số điện thoại
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px] bg-gray-50">
                      Phòng ban
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px] bg-gray-50">
                      Vị trí
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        {searchQuery || departmentFilter !== "all" || teamFilter
                          ? "Không tìm thấy nhân viên phù hợp"
                          : "Không có nhân viên nào"}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp: any) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleEmployee(emp.id)}
                      >
                        <td className="px-4 py-3 w-16">
                          <Checkbox
                            id={`emp-${emp.id}`}
                            checked={selectedEmployeeIds.includes(Number(emp.id))}
                            onCheckedChange={() => toggleEmployee(emp.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 min-w-[180px]">
                          {emp.user?.fullName || `Nhân viên #${emp.id}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[120px]">
                          {emp.user?.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[150px]">
                          {emp.department?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[150px]">
                          {emp.position?.name || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {formErrors.employees && (
            <p className="text-sm text-red-500">{formErrors.employees}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6 justify-end">
        <Button
          variant="outline"
          onClick={() => navigate("/nha-may-cua-toi/quan-ly-tang-ca-hang-loat")}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo đơn hàng loạt"}
        </Button>
      </div>
    </div>
  );
}
