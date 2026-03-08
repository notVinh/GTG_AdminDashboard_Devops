import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { employeeApi } from "../api/employee";
import { departmentApi } from "../api/departments";
import { teamApi } from "../api/team";
import { misaOrderApi } from "../api/misa-order";
import type { EmployeeItem } from "../types";
import type { Department, Team } from "../types/department";
import { useToast } from "../contexts/ToastContext";
import { Loader2, Truck, Package, CheckCircle, Search } from "lucide-react";

interface AssignOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  factoryId: number;
  onSuccess?: () => void;
}

const WORKFLOW_STEPS = [
  { value: "warehouse", label: "Kho chuẩn bị máy + phiếu xuất kho", icon: Package },
  { value: "quality_check", label: "Kỹ thuật kiểm tra máy + ký xác nhận", icon: CheckCircle },
  { value: "delivery", label: "Kho, giao vận nhận máy + ký phiếu", icon: Package },
  { value: "gate_control", label: "Kiểm soát + Bảo vệ kiểm tra", icon: CheckCircle },
  { value: "self_delivery", label: "Giao vận chuyển máy đến khách hàng", icon: Truck },
  { value: "installation", label: "Kỹ thuật lắp đặt máy + ký phiếu bàn giao", icon: CheckCircle },
  { value: "shipping_company", label: "Giao cho công ty vận chuyển", icon: Truck },
];

export default function AssignOrderDialog({
  isOpen,
  onClose,
  orderId,
  factoryId,
  onSuccess,
}: AssignOrderDialogProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Form state
  const [selectedStep, setSelectedStep] = useState<string>("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Shipping company fields (only for shipping_company step)
  const [shippingCompanyName, setShippingCompanyName] = useState("");
  const [shippingCompanyPhone, setShippingCompanyPhone] = useState("");
  const [shippingCompanyAddress, setShippingCompanyAddress] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Load employees, departments, teams
  useEffect(() => {
    if (!isOpen || !factoryId) return;

    const loadData = async () => {
      try {
        setLoadingEmployees(true);

        // Load all data in parallel
        const [empResponse, depsResponse, teamsResponse] = await Promise.all([
          employeeApi.listEmployees(1, 1000, factoryId),
          departmentApi.getAll(+factoryId).catch(() => []),
          teamApi.getAll(+factoryId).catch(() => []),
        ]);

        setEmployees(empResponse.data || []);
        setDepartments(depsResponse || []);
        setTeams(teamsResponse || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadData();
  }, [isOpen, factoryId, toast]);

  // Filter employees based on department, team, and search
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        emp.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Department filter
      const deptId = (emp as any).department?.id || (emp as any).departmentId;
      const matchesDepartment =
        departmentFilter === "all" || String(deptId ?? "") === String(departmentFilter);

      // Team filter
      const matchesTeam =
        teamFilter === "all" || String((emp as any).teamId ?? "") === String(teamFilter);

      return matchesSearch && matchesDepartment && matchesTeam;
    });
  }, [employees, searchTerm, departmentFilter, teamFilter]);

  // Filter teams by selected department
  const filteredTeams = useMemo(() => {
    if (departmentFilter === "all") return teams;
    return teams.filter((t) => String(t.departmentId) === String(departmentFilter));
  }, [teams, departmentFilter]);

  const handleToggleEmployee = (employeeId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedStep) {
      toast.error("Vui lòng chọn bước công việc");
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nhân viên");
      return;
    }

    if (selectedStep === "shipping_company" && !shippingCompanyName) {
      toast.error("Vui lòng nhập tên công ty vận chuyển");
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        assignedToEmployeeIds: selectedEmployeeIds,
        step: selectedStep,
      };

      if (notes) {
        data.notes = notes;
      }

      if (selectedStep === "shipping_company") {
        data.shippingCompanyName = shippingCompanyName;
        data.shippingCompanyPhone = shippingCompanyPhone;
        data.shippingCompanyAddress = shippingCompanyAddress;
        data.trackingNumber = trackingNumber;
      }

      await misaOrderApi.assignToMultiple(orderId, data);
      toast.success("Giao việc thành công!");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error("Error assigning order:", error);
      toast.error(error.message || "Không thể giao việc");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedStep("");
    setSelectedEmployeeIds([]);
    setNotes("");
    setDepartmentFilter("all");
    setTeamFilter("all");
    setSearchTerm("");
    setShippingCompanyName("");
    setShippingCompanyPhone("");
    setShippingCompanyAddress("");
    setTrackingNumber("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Giao việc</DialogTitle>
          <DialogDescription>
            Chọn bước công việc và nhân viên để giao việc
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Step Selection - Dropdown */}
          <div className="space-y-2">
            <Label>Bước công việc *</Label>
            <Select value={selectedStep} onValueChange={setSelectedStep}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn bước công việc" />
              </SelectTrigger>
              <SelectContent>
                {WORKFLOW_STEPS.map((step) => (
                  <SelectItem key={step.value} value={step.value}>
                    {step.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shipping Company Info (only for shipping_company step) */}
          {selectedStep === "shipping_company" && (
            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Thông tin công ty vận chuyển
              </h3>
              <div className="space-y-2">
                <div>
                  <Label>Tên công ty *</Label>
                  <Input
                    value={shippingCompanyName}
                    onChange={(e) => setShippingCompanyName(e.target.value)}
                    placeholder="Nhập tên công ty vận chuyển"
                  />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input
                    value={shippingCompanyPhone}
                    onChange={(e) => setShippingCompanyPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <Label>Địa chỉ</Label>
                  <Input
                    value={shippingCompanyAddress}
                    onChange={(e) => setShippingCompanyAddress(e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
                <div>
                  <Label>Mã vận đơn</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Nhập mã vận đơn"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-3">
            <Label>Chọn nhân viên * ({selectedEmployeeIds.length} đã chọn)</Label>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={(v) => {
                  setDepartmentFilter(v);
                  setTeamFilter("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Team Filter */}
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả tổ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tổ</SelectItem>
                  {filteredTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Employee List */}
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {employees.length === 0
                  ? "Không có nhân viên nào"
                  : "Không tìm thấy nhân viên phù hợp"}
              </div>
            ) : (
              <ScrollArea className="h-[250px] border border-gray-200 rounded-lg p-3">
                <div className="space-y-2">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={selectedEmployeeIds.includes(employee.id)}
                        onCheckedChange={() => handleToggleEmployee(employee.id)}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">{employee.user?.fullName}</div>
                        <div className="text-gray-500 text-xs">
                          {employee.department?.name} - {employee.position?.name}
                          {(employee as any).team?.name && ` - ${(employee as any).team.name}`}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selected employees list */}
            {selectedEmployeeIds.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Đã chọn ({selectedEmployeeIds.length} nhân viên):
                </div>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-blue-50 rounded-lg border border-blue-200">
                  {selectedEmployeeIds.map((id) => {
                    const emp = employees.find((e) => e.id === id);
                    if (!emp) return null;
                    return (
                      <div
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 rounded-full text-xs"
                      >
                        <span className="font-medium">{emp.user?.fullName}</span>
                        <span className="text-gray-500">
                          ({(emp as any).team?.name || emp.department?.name || "N/A"})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleEmployee(id)}
                          className="ml-1 text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (tùy chọn)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Giao việc
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
