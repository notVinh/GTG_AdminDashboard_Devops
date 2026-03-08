import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { leaveRequestApi } from "../../api/leave-request";
import { useDebounce } from "../../hooks/useDebounce";
import { employeeApi } from "../../api/employee";
import type { LeaveRequest, LeaveRequestStatus } from "../../types";
import { Button } from "../../components/ui/button";
import { Calendar, CheckCircle, UserCheck, Plus, AlertCircle, XCircle, Ban, Search, Eye, Edit, Download } from "lucide-react";
import CreateLeaveModal from "../../components/CreateLeaveModal";
import Pagination from "../../components/commons/Pagination";
import ApproveDetailModal from "../../components/ApproveDetailModal";
import RejectDetailModal from "../../components/RejectDetailModal";
import LeaveDetailContent from "../../components/LeaveDetailContent";
import LeaveRequestDetailModal from "../../components/LeaveRequestDetailModal";
import MonthNavigation from "../../components/commons/MonthNavigation";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import StatisticsCards from "../../components/commons/StatisticsCards";
import ExportLeaveRequestModal from "../../components/ExportLeaveRequestModal";

export default function MyFactoryLeaveManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | "all">("all");
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
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [editingLeaveRequest, setEditingLeaveRequest] = useState<LeaveRequest | null>(null);
  const [approveNote, setApproveNote] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectReasonError, setRejectReasonError] = useState<string>("");
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Auto-open detail modal from notification
  useEffect(() => {
    const detailId = searchParams.get('detailId');
    if (detailId && items.length > 0) {
      const item = items.find(i => String(i.id) === detailId);
      if (item) {
        setSelectedLeaveRequest(item);
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

  // Fetch employees once
  useEffect(() => {
    (async () => {
      if (!factoryId) return;
      try {
        const empList = await employeeApi.getByFactory(factoryId);
        setEmployees(empList);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
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

  // Fetch leave requests with server-side filters
  useEffect(() => {
    (async () => {
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

        const leaveRes = await leaveRequestApi.getByFactory(factoryId, query);
        setItems(leaveRes.data);
        setTotal(leaveRes.meta.total);
      } catch (error) {
        console.error("Failed to fetch leave requests:", error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId, page, limit, startDate, endDate, statusFilter, debouncedSearchTerm]);

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
    setPage(1);
  };

  const statusBadge = (status: LeaveRequestStatus) => {
    const config: Record<LeaveRequestStatus, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Chờ duyệt" },
      approved: { color: "bg-green-100 text-green-700", label: "Đã duyệt" },
      rejected: { color: "bg-red-100 text-red-700", label: "Từ chối" },
      cancelled: { color: "bg-gray-100 text-gray-700", label: "Đã hủy" },
      hr_confirmed: { color: "bg-blue-100 text-blue-700", label: "HR xác nhận" },
    };
    const { color, label } = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Helper: Lấy tên loại nghỉ phép, ưu tiên từ leaveTypeRef nếu có
  const getLeaveTypeName = (item: LeaveRequest) => {
    if (item.leaveTypeRef?.name) {
      return item.leaveTypeRef.name;
    }
    // Fallback cho dữ liệu cũ
    return item.leaveType === "paid" ? "Có lương" : "Không lương";
  };

  // Helper: Kiểm tra có lương hay không
  const isLeaveTypePaid = (item: LeaveRequest) => {
    if (item.leaveTypeRef) {
      return item.leaveTypeRef.isPaid;
    }
    return item.leaveType === "paid";
  };

  // Legacy helper cho các component con
  const leaveTypeLabel = (type: string) => {
    return type === "paid" ? "Có lương" : "Không lương";
  };

  const handleApprove = async (id: number) => {
    try {
      const updated = await leaveRequestApi.update(id, {
        status: "approved",
        decisionNote: approveNote || undefined
      });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowApproveModal(null);
      setApproveNote("");
    } catch (error) {
      console.error("Error approving leave request:", error);
    }
  };

  const handleApproveClick = (id: number) => {
    setApproveNote("");
    setShowApproveModal(id);
  };

  const handleReject = async (id: number) => {
    try {
      const updated = await leaveRequestApi.update(id, {
        status: "rejected",
        decisionNote: rejectReason,
      });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setShowRejectModal(null);
      setRejectReason("");
      setRejectReasonError("");
    } catch (error) {
      console.error("Error rejecting leave request:", error);
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

  const handleCreateSuccess = (leaveRequest: LeaveRequest) => {
    // Reload items để có dữ liệu mới nhất
    if (factoryId && startDate && endDate) {
      const query: any = {
        page,
        limit,
        startDate,
        endDate,
      };
      if (statusFilter !== "all") query.status = statusFilter;
      leaveRequestApi.getByFactory(factoryId, query).then((res) => {
        setItems(res.data);
        setTotal(res.meta.total);
      }).catch(console.error);
    }
    setShowCreateModal(false);
    setEditingLeaveRequest(null);
  };

  const handleViewDetail = (leaveRequest: LeaveRequest) => {
    setSelectedLeaveRequest(leaveRequest);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedLeaveRequest(null);
  };

  const handleEditClick = async (leaveRequest: LeaveRequest) => {
    // Load lại chi tiết đơn để có đầy đủ dữ liệu
    try {
      const detail = await leaveRequestApi.getById(leaveRequest.id);
      setEditingLeaveRequest(detail);
      setShowCreateModal(true);
    } catch (error) {
      console.error('Error loading leave request detail:', error);
      // Nếu không load được, vẫn dùng dữ liệu từ list
      setEditingLeaveRequest(leaveRequest);
      setShowCreateModal(true);
    }
  };

  const getActions = (leaveRequest: LeaveRequest) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => handleViewDetail(leaveRequest),
      },
    ];

    if (leaveRequest.status === "pending") {
      actions.push(
        {
          label: "Sửa",
          icon: <Edit className="h-4 w-4" />,
          onClick: () => handleEditClick(leaveRequest),
        },
        {
          label: "Duyệt",
          icon: <CheckCircle className="h-4 w-4" />,
          onClick: () => handleApproveClick(leaveRequest.id),
        },
        {
          label: "Từ chối",
          icon: <XCircle className="h-4 w-4" />,
          onClick: () => handleRejectClick(leaveRequest.id),
        }
      );
    }

    return actions;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold">Quản lý đơn nghỉ phép</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {factoryId && (
            <Button 
              onClick={() => setShowExportModal(true)} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất file
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tạo đơn nghỉ phép
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: (v: string) => setStatusFilter(v as LeaveRequestStatus | "all"),
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
            icon: <Calendar className="h-5 w-5" />,
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
          <h2 className="text-base sm:text-lg font-semibold">Danh sách đơn nghỉ phép</h2>
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
                      <div>
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${isLeaveTypePaid(e) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {getLeaveTypeName(e)}
                        </span>
                      </div>
                      <div><span className="text-gray-500">Từ:</span> {new Date(e.startDate).toLocaleDateString('vi-VN')}</div>
                      <div><span className="text-gray-500">Đến:</span> {new Date(e.endDate).toLocaleDateString('vi-VN')}</div>
                      <div><span className="text-gray-500">Số ngày:</span> {e.totalDays || 0} ngày</div>
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
                  Loại phép
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số ngày
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
                  <td colSpan={7} className="px-4 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center">
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
                      <span className={`px-2 py-1 rounded text-xs font-medium ${isLeaveTypePaid(e) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {getLeaveTypeName(e)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(e.startDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(e.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {e.totalDays || 0} ngày
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

      {/* Create Leave Modal */}
      {factoryId && employeeId && (
        <CreateLeaveModal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLeaveRequest(null);
          }}
          factoryId={factoryId}
          currentEmployeeId={employeeId}
          employeesManager={managers}
          employeesNotManager={employeesNotManager}
          onSuccess={handleCreateSuccess}
          editingLeaveRequest={editingLeaveRequest}
        />
      )}

      {/* Approve Detail Modal */}
      <ApproveDetailModal
        open={!!showApproveModal}
        onClose={() => setShowApproveModal(null)}
        onConfirm={() => showApproveModal && handleApprove(showApproveModal)}
        title="Chi tiết đơn nghỉ phép - Duyệt"
        note={approveNote}
        onNoteChange={setApproveNote}
      >
        {(() => {
          const item = filtered.find((e) => e.id === showApproveModal);
          if (!item) return null;
          return <LeaveDetailContent item={item} leaveTypeLabel={leaveTypeLabel} />;
        })()}
      </ApproveDetailModal>

      {/* Reject Detail Modal */}
      <RejectDetailModal
        open={!!showRejectModal}
        onClose={() => {
          setShowRejectModal(null);
          setRejectReason("");
          setRejectReasonError("");
        }}
        onConfirm={handleRejectConfirm}
        title="Chi tiết đơn nghỉ phép - Từ chối"
        reason={rejectReason}
        onReasonChange={handleRejectReasonChange}
        error={rejectReasonError}
      >
        {(() => {
          const item = filtered.find((e) => e.id === showRejectModal);
          if (!item) return null;
          return <LeaveDetailContent item={item} leaveTypeLabel={leaveTypeLabel} />;
        })()}
      </RejectDetailModal>

      {/* View Detail Modal */}
      <LeaveRequestDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        leaveRequest={selectedLeaveRequest}
      />

      {/* Export Modal */}
      {factoryId && (
        <ExportLeaveRequestModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          factoryId={factoryId}
        />
      )}
    </div>
  );
}
