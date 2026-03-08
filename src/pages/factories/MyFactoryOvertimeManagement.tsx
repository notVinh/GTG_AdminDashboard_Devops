import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { overtimeApi } from "../../api/overtime";
import { useDebounce } from "../../hooks/useDebounce";
import { overtimeCoefficientApi } from "../../api/overtime-coefficient";
import { employeeApi } from "../../api/employee";
import type { Overtime, OvertimeStatus, OvertimeCoefficient } from "../../types";
import { Button } from "../../components/ui/button";
import { Clock, CheckCircle, UserCheck, Plus, AlertCircle, XCircle, Ban, Search, Eye, Edit } from "lucide-react";
import CreateOvertimeModal from "../../components/CreateOvertimeModal";
import ApproveDetailModal from "../../components/ApproveDetailModal";
import RejectDetailModal from "../../components/RejectDetailModal";
import OvertimeDetailContent from "../../components/OvertimeDetailContent";
import OvertimeDetailModal from "../../components/OvertimeDetailModal";
import Pagination from "../../components/commons/Pagination";
import MonthNavigation from "../../components/commons/MonthNavigation";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import StatisticsCards from "../../components/commons/StatisticsCards";

export default function MyFactoryOvertimeManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<Overtime[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [coefficients, setCoefficients] = useState<OvertimeCoefficient[]>([]);
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | "all">("all");
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showApproveModal, setShowApproveModal] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingOvertime, setEditingOvertime] = useState<Overtime | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedOvertime, setSelectedOvertime] = useState<Overtime | null>(null);
  const [approveNote, setApproveNote] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectReasonError, setRejectReasonError] = useState<string>("");

  // Auto-open detail modal from notification
  useEffect(() => {
    const detailId = searchParams.get('detailId');
    if (detailId && items.length > 0) {
      const item = items.find(i => String(i.id) === detailId);
      if (item) {
        setSelectedOvertime(item);
        setShowDetailModal(true);
        // Remove detailId from URL
        searchParams.delete('detailId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, items, setSearchParams]);

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

  // Fetch employees and coefficients once
  useEffect(() => {
    (async () => {
      if (!factoryId) return;
      try {
        const [empList, coeffList] = await Promise.all([
          employeeApi.getByFactory(factoryId),
          overtimeCoefficientApi.getByFactory(factoryId),
        ]);
        setEmployees(empList);
        setCoefficients(coeffList);
      } catch (error) {
        console.error("Failed to fetch employees/coefficients:", error);
      }
    })();
  }, [factoryId]);

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Function to load overtime items
  const loadItems = useCallback(async () => {
    if (!factoryId || !startDate || !endDate) return;

    setLoading(true);
    try {
      const query: any = {
        page,
        limit,
        startDate,
        endDate,
      };

      if (statusFilter !== "all") query.status = statusFilter;
      if (debouncedSearchTerm.trim()) query.search = debouncedSearchTerm.trim();
      // Note: assignedToMe filtering - backend doesn't support approverEmployeeId filter yet
      // So we'll keep this as client-side for now

      const overtimeRes = await overtimeApi.getByFactory(factoryId, query);
      setItems(overtimeRes.data);
      setTotal(overtimeRes.meta.total);
    } catch (error) {
      console.error("Failed to fetch overtime:", error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [factoryId, page, limit, startDate, endDate, statusFilter, debouncedSearchTerm]);

  // Fetch overtime with server-side filters
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Filter managers only for approver dropdown
  const managers = useMemo(() => {
    return employees.filter((emp) => emp.isManager === true);
  }, [employees]);

  const employeesNotManager = useMemo(() => {
    return employees.filter((emp) => emp.isManager === false);
  }, [employees]);

  // Client-side filtering only for assignedToMe (search is now server-side)
  const filtered = useMemo(() => {
    return items.filter((it) => {
      // Filter by approver (client-side since backend doesn't support this yet)
      if (assignedToMe && employeeId && it.approverEmployeeId !== employeeId)
        return false;

      return true;
    });
  }, [items, assignedToMe, employeeId]);

  // Reset page to 1 when server filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, assignedToMe, debouncedSearchTerm, selectedMonth, selectedYear, startDate, endDate, limit]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || assignedToMe || searchTerm.trim() !== "";

  // Helper functions for month navigation
  const handlePrevMonth = () => {
    setStartDate("");
    setEndDate("");

    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setStartDate("");
    setEndDate("");

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleToday = () => {
    setStartDate("");
    setEndDate("");

    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  const statusBadge = (status: OvertimeStatus) => {
    const color =
      status === "approved"
        ? "bg-green-100 text-green-700"
        : status === "rejected"
        ? "bg-red-100 text-red-700"
        : status === "cancelled"
        ? "bg-gray-100 text-gray-700"
        : "bg-yellow-100 text-yellow-700";
    const vi =
      status === "approved"
        ? "Đã duyệt"
        : status === "rejected"
        ? "Từ chối"
        : status === "cancelled"
        ? "Đã hủy"
        : "Chờ duyệt";
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {vi}
      </span>
    );
  };

  const overtimeRateLabel = (rate: number) => {
    if (rate === 1.5) return "1.5x (Ngày thường)";
    if (rate === 2.0) return "2.0x (Cuối tuần)";
    if (rate === 3.0) return "3.0x (Lễ/Tết)";
    return `${rate}x`;
  };

  const handleApprove = async (id: number) => {
    try {
      const updated = await overtimeApi.update(id, {
        status: "approved",
        decisionNote: approveNote || undefined
      });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowApproveModal(null);
      setApproveNote("");
    } catch (error) {
      console.error("Error approving overtime:", error);
    }
  };

  const handleApproveClick = (id: number) => {
    setApproveNote("");
    setShowApproveModal(id);
  };

  const handleReject = async (id: number) => {
    try {
      const updated = await overtimeApi.update(id, {
        status: "rejected",
        decisionNote: rejectReason,
      });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowRejectModal(null);
      setRejectReason("");
      setRejectReasonError("");
    } catch (error) {
      console.error("Error rejecting overtime:", error);
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectReason("");
    setRejectReasonError("");
    setShowRejectModal(id);
  };

  const handleRejectReasonChange = (value: string) => {
    setRejectReason(value);
    if (value.trim() && rejectReasonError) {
      setRejectReasonError("");
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setRejectReasonError("Vui lòng nhập lý do từ chối");
      return;
    }
    if (showRejectModal) {
      handleReject(showRejectModal);
    }
  };

  const handleCreateSuccess = (created: Overtime) => {
    setItems((prev) => [created, ...prev]);
  };

  const handleViewDetail = (overtime: Overtime) => {
    setSelectedOvertime(overtime);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOvertime(null);
  };

  const getActions = (overtime: Overtime) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => handleViewDetail(overtime),
      },
    ];

    if (overtime.status === "pending") {
      actions.push(
        {
          label: "Sửa",
          icon: <Edit className="h-4 w-4" />,
          onClick: () => handleEditClick(overtime),
        },
        {
          label: "Duyệt",
          icon: <CheckCircle className="h-4 w-4" />,
          onClick: () => handleApproveClick(overtime.id),
        },
        {
          label: "Từ chối",
          icon: <XCircle className="h-4 w-4" />,
          onClick: () => handleRejectClick(overtime.id),
        }
      );
    }

    return actions;
  };

  const handleEditClick = async (overtime: Overtime) => {
    // Load lại chi tiết đơn để có đầy đủ dữ liệu (bao gồm employee relation)
    try {
      const detail = await overtimeApi.getById(overtime.id);
      setEditingOvertime(detail);
    } catch (error) {
      console.error('Error loading overtime detail:', error);
      // Nếu không load được, vẫn dùng dữ liệu từ list
      setEditingOvertime(overtime);
    }
    setShowCreateModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold">Quản lý đơn tăng ca</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Tạo đơn tăng ca
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: (v: string) => setStatusFilter(v as OvertimeStatus | "all"),
              options: [
                { value: "all", label: "Tất cả trạng thái" },
                { value: "pending", label: "Chờ duyệt" },
                { value: "approved", label: "Đã duyệt" },
                { value: "rejected", label: "Từ chối" },
                { value: "cancelled", label: "Đã hủy" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
            {
              type: "checkbox",
              label: "Chỉ đơn giao cho tôi duyệt",
              value: assignedToMe,
              onChange: setAssignedToMe,
            },
          ]}
          gridCols="sm:grid-cols-2"
          defaultOpen={true}
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("all");
            setAssignedToMe(false);
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Statistics Cards */}
      <StatisticsCards
        cards={[
          {
            value: filtered.length,
            label: "Tổng đơn",
            icon: <Clock className="h-5 w-5" />,
            bgColor: "blue",
          },
          {
            value: filtered.filter((item) => item.status === "pending").length,
            label: "Chờ duyệt",
            icon: <AlertCircle className="h-5 w-5" />,
            bgColor: "yellow",
          },
          {
            value: filtered.filter((item) => item.status === "approved").length,
            label: "Đã duyệt",
            icon: <CheckCircle className="h-5 w-5" />,
            bgColor: "green",
          },
          {
            value: filtered.filter((item) => item.status === "rejected").length,
            label: "Từ chối",
            icon: <XCircle className="h-5 w-5" />,
            bgColor: "red",
          },
        ]}
        gridCols="md:grid-cols-4"
      />

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">Danh sách đơn tăng ca</h2>
          <MonthNavigation
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm">Không có dữ liệu tháng {selectedMonth + 1} năm {selectedYear}</div>
          ) : (
            filtered.map((e) => (
              <div key={e.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {e.employee?.user?.fullName || `#${e.employeeId}`}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div><span className="text-gray-500">Ngày:</span> {new Date(e.overtimeDate).toLocaleDateString('vi-VN')}</div>
                      <div><span className="text-gray-500">Giờ:</span> {e.startTime} - {e.endTime}</div>
                      <div><span className="text-gray-500">Số giờ:</span> {e.totalHours || 0}h</div>
                      <div><span className="text-gray-500">Hệ số:</span> {e.overtimeRate}x</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {statusBadge(e.status)}
                      <ActionsDropdown actions={getActions(e)} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tăng ca
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giờ bắt đầu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giờ kết thúc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số giờ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hệ số
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
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center">
                    Không có dữ liệu tháng {selectedMonth + 1} năm {selectedYear}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {e.employee?.user?.fullName || `#${e.employeeId}`}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(e.overtimeDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {e.startTime}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {e.endTime}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {e.totalHours || 0}h
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {e.coefficientName ? (
                        <div>
                          <div className="text-xs text-gray-500">{e.overtimeRate}x</div>
                        </div>
                      ) : (
                        overtimeRateLabel(e.overtimeRate)
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {statusBadge(e.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <ActionsDropdown actions={getActions(e)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Create/Edit Overtime Modal */}
      {factoryId && employeeId && (
        <CreateOvertimeModal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOvertime(null);
          }}
          factoryId={factoryId}
          currentEmployeeId={employeeId}
          employeesManager={managers}
          employeesNotManager={employeesNotManager}
          coefficients={coefficients}
          onSuccess={(overtime) => {
            loadItems();
            setShowCreateModal(false);
            setEditingOvertime(null);
          }}
          editingOvertime={editingOvertime}
        />
      )}

      {/* Approve Detail Modal */}
      <ApproveDetailModal
        open={!!showApproveModal}
        onClose={() => setShowApproveModal(null)}
        onConfirm={() => showApproveModal && handleApprove(showApproveModal)}
        title="Chi tiết đơn tăng ca - Duyệt"
        note={approveNote}
        onNoteChange={setApproveNote}
      >
        {(() => {
          const item = filtered.find((e) => e.id === showApproveModal);
          if (!item) return null;
          return <OvertimeDetailContent item={item} overtimeRateLabel={overtimeRateLabel} />;
        })()}
      </ApproveDetailModal>

      {/* Reject Detail Modal */}
      <RejectDetailModal
        open={!!showRejectModal}
        onClose={() => setShowRejectModal(null)}
        onConfirm={handleRejectConfirm}
        title="Chi tiết đơn tăng ca - Từ chối"
        reason={rejectReason}
        onReasonChange={handleRejectReasonChange}
        error={rejectReasonError}
      >
        {(() => {
          const item = filtered.find((e) => e.id === showRejectModal);
          if (!item) return null;
          return <OvertimeDetailContent item={item} overtimeRateLabel={overtimeRateLabel} />;
        })()}
      </RejectDetailModal>

      {/* View Detail Modal */}
      <OvertimeDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        overtime={selectedOvertime}
        onRefresh={loadItems}
      />
    </div>
  );
}
