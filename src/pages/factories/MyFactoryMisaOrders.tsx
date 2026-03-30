import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AssignOrderDialog from "../../components/AssignOrderDialog";
import {
  FileText,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  User,
  Package,
} from "lucide-react";
import { usersApi } from "../../api/users";
import { misaOrderApi } from "../../api/misa-order";
import type { MisaOrder } from "../../types/misa-order";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import MonthNavigation from "../../components/commons/MonthNavigation";
import Pagination from "../../components/commons/Pagination";
import { format } from "date-fns";

export default function MyFactoryMisaOrders() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const { confirm } = useConfirm();
  const [myFactory, setMyFactory] = useState<any>(null);
  const [orders, setOrders] = useState<MisaOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to update URL params
  const updateSearchParams = useCallback(
    (newParams: Record<string, string | number | null | undefined>) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      });
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // States initialized from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "");
  const [stepFilter, setStepFilter] = useState<string>(searchParams.get("step") || "");
  const [actionLoading, setActionLoading] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState<number>(Number(searchParams.get("limit")) || 20);
  const [total, setTotal] = useState<number>(0);

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState<number>(
    searchParams.get("month")
      ? Number(searchParams.get("month")) - 1
      : new Date().getMonth(),
  ); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(
    searchParams.get("year")
      ? Number(searchParams.get("year"))
      : new Date().getFullYear(),
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sync state with URL when searchParams changes (e.g. back button)
  useEffect(() => {
    const urlPage = Number(searchParams.get("page")) || 1;
    const urlLimit = Number(searchParams.get("limit")) || 20;
    const urlSearch = searchParams.get("search") || "";
    const urlStatus = searchParams.get("status") || "";
    const urlStep = searchParams.get("step") || "";
    const urlMonth = searchParams.get("month") ? Number(searchParams.get("month")) - 1 : new Date().getMonth();
    const urlYear = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

    if (page !== urlPage) setPage(urlPage);
    if (limit !== urlLimit) setLimit(urlLimit);
    if (searchTerm !== urlSearch) setSearchTerm(urlSearch);
    if (statusFilter !== urlStatus) setStatusFilter(urlStatus);
    if (stepFilter !== urlStep) setStepFilter(urlStep);
    if (selectedMonth !== urlMonth) setSelectedMonth(urlMonth);
    if (selectedYear !== urlYear) setSelectedYear(urlYear);
  }, [searchParams]);


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

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch orders with server-side filters
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!myFactory?.id || !startDate || !endDate) return;

      try {
        setLoading(true);
        const query: any = {
          page,
          limit,
          startDate,
          endDate,
        };

        if (statusFilter) query.status = statusFilter;
        if (stepFilter) query.step = stepFilter;

        const response = await misaOrderApi.getByFactory(myFactory.id, query);

        if (isMounted) {
          // Check if response has pagination structure
          if (response?.data && response?.meta) {
            setOrders(response.data);
            setTotal(response.meta.total);
          } else if (Array.isArray(response)) {
            // Fallback for non-paginated response
            setOrders(response);
            setTotal(response.length);
          } else {
            setOrders([]);
            setTotal(0);
          }
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        if (isMounted) {
          setOrders([]);
          setTotal(0);
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
  }, [myFactory?.id, page, limit, startDate, endDate, statusFilter, stepFilter]);

  // Client-side filtering only for search term (status filtered server-side)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const orderNumber = order.orderNumber.toLowerCase();
        const customerName = order.customerName.toLowerCase();
        return orderNumber.includes(search) || customerName.includes(search);
      }
      return true;
    });
  }, [orders, searchTerm]);

  // Reset page to 1 when filters change is now handled by updateSearchParams in individual change handlers


  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "" || stepFilter !== "" || searchTerm.trim() !== "";

  // Month navigation handlers
  const handlePrevMonth = () => {
    const nextMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const nextYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    updateSearchParams({
      page: 1,
      month: nextMonth + 1,
      year: nextYear,
    });
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    updateSearchParams({
      page: 1,
      month: nextMonth + 1,
      year: nextYear,
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    updateSearchParams({ page: 1, limit: newLimit });
  };


  const loadOrders = async () => {
    if (!myFactory?.id || !startDate || !endDate) return;

    try {
      const query: any = {
        page,
        limit,
        startDate,
        endDate,
      };

      if (statusFilter) query.status = statusFilter;
      if (stepFilter) query.step = stepFilter;

      const response = await misaOrderApi.getByFactory(myFactory.id, query);

      // Check if response has pagination structure
      if (response?.data && response?.meta) {
        setOrders(response.data);
        setTotal(response.meta.total);
      } else if (Array.isArray(response)) {
        // Fallback for non-paginated response
        setOrders(response);
        setTotal(response.length);
      } else {
        setOrders([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
      setTotal(0);
    }
  };

  const handleApprove = async (orderId: number) => {
    const confirmed = await confirm({
      title: "Xác nhận duyệt đơn hàng",
      message: "Bạn có chắc muốn duyệt đơn hàng này?",
      confirmText: "Duyệt",
      cancelText: "Hủy",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.approve(orderId);
      toast.success("Duyệt đơn hàng thành công!");
      await loadOrders();
    } catch (err: any) {
      console.error("Error approving order:", err);
      toast.error(err.message || "Không thể duyệt đơn hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string, statusLabel: string) => {
    const confirmed = await confirm({
      title: "Xác nhận cập nhật trạng thái",
      message: `Bạn có chắc muốn chuyển trạng thái thành "${statusLabel}"?`,
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      type: status === "cancelled" ? "danger" : undefined,
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.updateStatus(orderId, status);
      toast.success("Cập nhật trạng thái thành công!");
      await loadOrders();
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (orderId: number) => {
    const confirmed = await confirm({
      title: "Xác nhận xóa đơn hàng",
      message: "Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await misaOrderApi.delete(orderId);
      toast.success("Xóa đơn hàng thành công!");
      await loadOrders();
    } catch (err: any) {
      console.error("Error deleting order:", err);
      toast.error(err.message || "Không thể xóa đơn hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const getActions = (order: MisaOrder) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => navigate(`/nha-may-cua-toi/misa-orders/${order.id}`),
      },
    ];

    // Nút Duyệt - chỉ hiện khi status là pendingApproval
    if (order.status === "pendingApproval") {
      actions.push({
        label: "Duyệt",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => handleApprove(order.id),
      });
    }

    // Nút Giao việc - hiện cho đã duyệt, đã giao, hoặc đang xử lý
    if (["approved", "assigned", "processing"].includes(order.status)) {
      actions.push({
        label: "Giao việc",
        icon: <UserPlus className="h-4 w-4" />,
        onClick: () => {
          setSelectedOrderId(order.id);
          setIsAssignDialogOpen(true);
        },
      });
    }

    // Nút chuyển trạng thái - khi đã giao hoặc đang xử lý
    if (order.status === "assigned") {
      actions.push({
        label: "Đang xử lý",
        icon: <Clock className="h-4 w-4" />,
        onClick: () => handleUpdateStatus(order.id, "processing", "Đang xử lý"),
      });
    }

    if (order.status === "processing") {
      actions.push({
        label: "Hoàn thành",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => handleUpdateStatus(order.id, "completed", "Hoàn thành"),
      });
    }

    // Nút Hủy - chỉ hiện khi chưa hoàn thành
    if (!["completed", "cancelled"].includes(order.status)) {
      actions.push({
        label: "Hủy đơn",
        icon: <XCircle className="h-4 w-4" />,
        onClick: () => handleUpdateStatus(order.id, "cancelled", "Hủy"),
      });
    }

    // Nút Xóa - luôn hiện
    actions.push({
      label: "Xóa",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => handleDelete(order.id),
    });

    return actions;
  };

  const getStepBadge = (step?: string, status?: string) => {
    // If order is completed or cancelled, show that status instead of step
    if (status === "completed" || status === "cancelled") {
      const statusMap: Record<
        string,
        { label: string; className: string; icon: React.ReactNode }
      > = {
        cancelled: {
          label: "Đã hủy",
          className: "bg-red-100 text-red-800",
          icon: <XCircle className="h-3 w-3" />,
        },
        completed: {
          label: "Hoàn thành",
          className: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-3 w-3" />,
        },
      };

      const statusInfo = statusMap[status || ""] || {
        label: status || "-",
        className: "bg-gray-100 text-gray-800",
        icon: null,
      };

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full text-center leading-tight ${statusInfo.className}`}
          style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
        >
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </span>
      );
    }

    // If no step, show status
    if (!step) {
      const statusMap: Record<
        string,
        { label: string; className: string; icon: React.ReactNode }
      > = {
        pendingApproval: {
          label: "Chờ duyệt",
          className: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="h-3 w-3" />,
        },
        approved: {
          label: "Đã duyệt",
          className: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-3 w-3" />,
        },
        cancelled: {
          label: "Đã hủy",
          className: "bg-red-100 text-red-800",
          icon: <XCircle className="h-3 w-3" />,
        },
        completed: {
          label: "Hoàn thành",
          className: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-3 w-3" />,
        },
      };

      const statusInfo = statusMap[status || ""] || {
        label: status || "-",
        className: "bg-gray-100 text-gray-800",
        icon: null,
      };

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full text-center leading-tight ${statusInfo.className}`}
          style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
        >
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </span>
      );
    }

    // Show step badge
    const stepMap: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      warehouse: {
        label: "Kho chuẩn bị",
        className: "bg-purple-100 text-purple-800",
        icon: <Package className="h-3 w-3" />,
      },
      quality_check: {
        label: "Kiểm tra chất lượng",
        className: "bg-purple-100 text-purple-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      delivery: {
        label: "Giao vận nhận máy",
        className: "bg-blue-100 text-blue-800",
        icon: <Package className="h-3 w-3" />,
      },
      gate_control: {
        label: "Kiểm soát cổng",
        className: "bg-blue-100 text-blue-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      self_delivery: {
        label: "Giao hàng trực tiếp",
        className: "bg-cyan-100 text-cyan-800",
        icon: <Package className="h-3 w-3" />,
      },
      installation: {
        label: "Lắp đặt",
        className: "bg-cyan-100 text-cyan-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      shipping_company: {
        label: "Vận chuyển",
        className: "bg-cyan-100 text-cyan-800",
        icon: <Package className="h-3 w-3" />,
      },
      inventory_check: {
        label: "Kiểm kho",
        className: "bg-cyan-100 text-cyan-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      pending_order: {
        label: "Chờ đặt hàng",
        className: "bg-cyan-100 text-cyan-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
    };

    const stepInfo = stepMap[step] || {
      label: step,
      className: "bg-gray-100 text-gray-800",
      icon: null,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full text-center leading-tight ${stepInfo.className}`}
        style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
      >
        {stepInfo.icon}
        <span>{stepInfo.label}</span>
      </span>
    );
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
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Danh sách đơn hàng MISA</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Quản lý đơn hàng trong nhà máy {myFactory?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: (val) => updateSearchParams({ page: 1, status: val }),
              options: [
                { value: "", label: "Tất cả trạng thái" },
                { value: "pendingApproval", label: "Chờ duyệt" },
                { value: "approved", label: "Đã duyệt" },
                { value: "assigned", label: "Đã giao" },
                { value: "processing", label: "Đang xử lý" },
                { value: "completed", label: "Hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
            {
              type: "select",
              label: "Bước công việc",
              value: stepFilter,
              onChange: (val) => updateSearchParams({ page: 1, step: val }),
              options: [
                { value: "", label: "Tất cả bước" },
                { value: "warehouse", label: "Kho chuẩn bị máy" },
                { value: "quality_check", label: "Kiểm tra chất lượng" },
                { value: "delivery", label: "Giao vận nhận máy" },
                { value: "gate_control", label: "Kiểm soát cổng" },
                { value: "self_delivery", label: "Giao hàng trực tiếp" },
                { value: "installation", label: "Lắp đặt" },
                { value: "shipping_company", label: "Vận chuyển" },
                { value: "pending_order", label: "Chờ đặt hàng" },
                { value: "inventory_check", label: "Kiểm tra hàng tồn" },
              ],
              icon: <Package className="h-4 w-4 text-gray-400" />,
            },
          ]}
          gridCols="sm:grid-cols-2"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập số đơn hàng hoặc tên khách hàng..."
                value={searchTerm}
                onChange={(e) => updateSearchParams({ page: 1, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            updateSearchParams({
              page: 1,
              status: "",
              step: "",
              search: "",
            });
          }}
          hasActiveFilters={hasActiveFilters}

        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(() => {
          const totalOrders = filteredOrders.length;
          const pendingCount = filteredOrders.filter(
            (o) => o.status === "pendingApproval"
          ).length;
          const approvedCount = filteredOrders.filter(
            (o) => o.status === "approved"
          ).length;
          const completedCount = filteredOrders.filter(
            (o) => o.status === "completed"
          ).length;
          return (
            <>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <div className="text-sm text-gray-500">Tổng đơn hàng</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{pendingCount}</div>
                    <div className="text-sm text-gray-500">Chờ duyệt</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{approvedCount}</div>
                    <div className="text-sm text-gray-500">Đã duyệt</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{completedCount}</div>
                    <div className="text-sm text-gray-500">Hoàn thành</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">
            Danh sách đơn hàng
          </h2>
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
          ) : filteredOrders.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm">
              Không có đơn hàng nào trong tháng {selectedMonth + 1} năm {selectedYear}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 space-y-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/nha-may-cua-toi/misa-orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 mb-2">
                      <span className="font-bold text-blue-600 text-base">
                        {order.orderNumber}
                      </span>
                      {getStepBadge(order.currentStep, order.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Khách hàng:</span>{" "}
                          <span className="text-gray-900 font-medium">{order.customerName}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Ngày đặt:</span>{" "}
                          <span className="text-gray-900">{format(new Date(order.orderDate), "dd/MM/yyyy")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <ActionsDropdown actions={getActions(order)} />
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
                  Số đơn hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bước công việc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    Không có đơn hàng nào trong tháng {selectedMonth + 1} năm {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/nha-may-cua-toi/misa-orders/${order.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(order.orderDate), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[200px]">
                        {getStepBadge(order.currentStep, order.status)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <ActionsDropdown actions={getActions(order)} />
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

      {/* Assign Order Dialog */}
      {myFactory && selectedOrderId && (
        <AssignOrderDialog
          isOpen={isAssignDialogOpen}
          onClose={() => {
            setIsAssignDialogOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
          factoryId={myFactory.id}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}
