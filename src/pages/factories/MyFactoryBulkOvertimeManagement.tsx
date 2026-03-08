import { useEffect, useMemo, useState } from "react";
import { bulkOvertimeRequestApi } from "../../api/bulk-overtime-request";
import { employeeApi } from "../../api/employee";
import { overtimeCoefficientApi } from "../../api/overtime-coefficient";
import { Button } from "../../components/ui/button";
import { Plus, Eye, CheckCircle, XCircle, FileText, Users, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import Pagination from "../../components/commons/Pagination";
import FilterSection from "../../components/commons/FilterSection";
import MonthNavigation from "../../components/commons/MonthNavigation";
import type { BulkOvertimeRequest, BulkOvertimeRequestStatus } from "../../types/bulk-overtime-request";
import type { OvertimeCoefficient } from "../../types";
import { departmentApi } from "../../api/departments";

export default function MyFactoryBulkOvertimeManagement() {
  const navigate = useNavigate();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<BulkOvertimeRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [coefficients, setCoefficients] = useState<OvertimeCoefficient[]>([]);
  const [statusFilter, setStatusFilter] = useState<BulkOvertimeRequestStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmingItem, setConfirmingItem] = useState<BulkOvertimeRequest | null>(null);
  const [cancellingItem, setCancellingItem] = useState<BulkOvertimeRequest | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted) {
          if (me) {
            setFactoryId(Number((me as any).factoryId));
            setEmployeeId(Number((me as any).id));
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadData = async () => {
    if (!factoryId) return;
    setLoading(true);
    try {
      const [list, empList, deptList, coeffList] = await Promise.all([
        bulkOvertimeRequestApi.getByFactory(factoryId),
        employeeApi.getByFactory(factoryId),
        departmentApi.getByFactory(factoryId),
        overtimeCoefficientApi.getByFactory(factoryId),
      ]);
      setItems(list);
      setEmployees(empList);
      setDepartments(deptList);
      setCoefficients(coeffList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [factoryId]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      // Filter by status
      if (statusFilter !== "all" && it.status !== statusFilter) return false;

      // Filter by month/year
      const overtimeDate = new Date(it.overtimeDate);
      if (overtimeDate.getMonth() !== selectedMonth || overtimeDate.getFullYear() !== selectedYear) {
        return false;
      }

      // Filter by search term (title)
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const title = it.title?.toLowerCase() || "";
        const reason = it.reason?.toLowerCase() || "";
        const coefficientName = it.coefficientName?.toLowerCase() || "";
        if (!title.includes(search) && !reason.includes(search) && !coefficientName.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [items, statusFilter, searchTerm, selectedMonth, selectedYear]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, selectedMonth, selectedYear]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || searchTerm.trim() !== "";

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const statusBadge = (status: BulkOvertimeRequestStatus) => {
    const color =
      status === "confirmed"
        ? "bg-green-100 text-green-700"
        : status === "cancelled"
        ? "bg-gray-100 text-gray-700"
        : "bg-blue-100 text-blue-700";
    const vi =
      status === "confirmed"
        ? "Đã xác nhận"
        : status === "cancelled"
        ? "Đã hủy"
        : "Nháp";
    return (
      <Badge className={color}>
        {vi}
      </Badge>
    );
  };

  const handleConfirm = async (item: BulkOvertimeRequest) => {
    try {
      const updated = await bulkOvertimeRequestApi.confirm(item.id, true); // Always auto approve
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      setConfirmingItem(null);
    } catch (error) {
      console.error("Error confirming bulk overtime:", error);
    }
  };

  const handleCancel = async (item: BulkOvertimeRequest) => {
    try {
      const updated = await bulkOvertimeRequestApi.cancel(item.id);
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      setCancellingItem(null);
    } catch (error) {
      console.error("Error cancelling bulk overtime:", error);
    }
  };

  const getActions = (item: BulkOvertimeRequest) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="w-4 h-4" />,
        onClick: () => navigate(`/nha-may-cua-toi/don-tang-ca-hang-loat/${item.id}`),
      },
    ];

    if (item.status === "draft") {
      actions.push(
        {
          label: "Xác nhận",
          icon: <CheckCircle className="w-4 h-4" />,
          onClick: () => setConfirmingItem(item),
        },
        {
          label: "Hủy đơn",
          icon: <XCircle className="w-4 h-4" />,
          onClick: () => setCancellingItem(item),
        }
      );
    }

    return actions;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đơn tăng ca hàng loạt</h1>
          <p className="text-gray-600 mt-1">
            Tạo và quản lý đơn tăng ca hàng loạt cho nhiều nhân viên
          </p>
        </div>
        <Button onClick={() => navigate("/nha-may-cua-toi/tao-don-tang-ca-hang-loat")} className="mt-4 md:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Tạo đơn hàng loạt
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: (v: string) => setStatusFilter(v as BulkOvertimeRequestStatus | "all"),
              options: [
                { value: "all", label: "Tất cả trạng thái" },
                { value: "draft", label: "Nháp" },
                { value: "confirmed", label: "Đã xác nhận" },
                { value: "cancelled", label: "Đã hủy" },
              ],
            },
          ]}
          gridCols="sm:grid-cols-2"
          defaultOpen={true}
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("all");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold">Danh sách đơn tăng ca hàng loạt</h2>
            <MonthNavigation
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
              showTodayButton={true}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số NV
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tăng ca
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tạo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người duyệt
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center">
                      Đang tải...
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center">
                      Không có dữ liệu tháng {selectedMonth + 1} năm {selectedYear}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.coefficientName} ({item.overtimeRate}x)
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {statusBadge(item.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {item.employees?.length || 0}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(item.overtimeDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.totalHours}h
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {item.creator?.user?.fullName || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {item.approver?.user?.fullName || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end">
                          <ActionsDropdown actions={getActions(item)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!loading && paginatedItems.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={page}
            limit={limit}
            total={filtered.length}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}

      {/* Confirm Modal */}
      <Dialog open={!!confirmingItem} onOpenChange={(open) => {
        if (!open) {
          setConfirmingItem(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đơn tăng ca hàng loạt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận đơn này?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                Sau khi xác nhận, hệ thống sẽ:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>Tạo {confirmingItem?.employees?.length || 0} đơn tăng ca cho từng nhân viên</li>
                <li>Tự động duyệt tất cả các đơn tăng ca</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingItem(null)}>
              Hủy
            </Button>
            <Button
              onClick={() => confirmingItem && handleConfirm(confirmingItem)}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={!!cancellingItem} onOpenChange={() => setCancellingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn tăng ca hàng loạt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đơn này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingItem(null)}>
              Không
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancellingItem && handleCancel(cancellingItem)}
            >
              Hủy đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
