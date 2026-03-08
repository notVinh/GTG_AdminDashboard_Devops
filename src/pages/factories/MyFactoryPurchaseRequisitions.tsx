import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { purchaseRequisitionApi } from "../../api/purchase-requisition";
import type { PurchaseRequisition } from "../../types/purchase-requisition";
import { useToast } from "../../contexts/ToastContext";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import MonthNavigation from "../../components/commons/MonthNavigation";
import Pagination from "../../components/commons/Pagination";
import { format } from "date-fns";

const STATUS_MAP = {
  pending: {
    label: "Chờ duyệt",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  approved: {
    label: "Đã duyệt",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  },
  rejected: {
    label: "Từ chối",
    color: "text-red-600 bg-red-50",
    icon: XCircle,
  },
};

export default function MyFactoryPurchaseRequisitions() {
  const navigate = useNavigate();
  const toast = useToast();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Calculate startDate and endDate from selectedMonth/selectedYear
  useEffect(() => {
    if (!startDate && !endDate) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  // Fetch requisitions
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!startDate || !endDate) return;

      try {
        setLoading(true);
        const query: any = {
          page,
          limit,
          startDate,
          endDate,
        };

        if (statusFilter) {
          query.status = statusFilter;
        }

        const result = await purchaseRequisitionApi.getAll(query);

        if (isMounted) {
          if (Array.isArray(result)) {
            setRequisitions(result);
            setTotal(result.length);
          } else {
            setRequisitions(result?.data || []);
            setTotal(result?.meta?.total || 0);
          }
        }
      } catch (error: any) {
        console.error("Error fetching purchase requisitions:", error);
        if (isMounted) {
          toast?.error("Không thể tải danh sách đề xuất mua hàng");
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
  }, [page, limit, statusFilter, startDate, endDate]);

  // Client-side search filtering
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const reqNumber = req.requisitionNumber.toLowerCase();
        const orderNumber = req.misaOrder?.orderNumber?.toLowerCase() || "";
        return reqNumber.includes(search) || orderNumber.includes(search);
      }
      return true;
    });
  }, [requisitions, searchTerm]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, selectedMonth, selectedYear, startDate, endDate, limit]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "" || searchTerm.trim() !== "";

  // Month navigation handlers
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP];
    if (!statusInfo) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {status}
        </span>
      );
    }

    const StatusIcon = statusInfo.icon;
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status] || "bg-gray-100 text-gray-800"}`}>
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </span>
    );
  };

  const getActions = (req: PurchaseRequisition) => {
    return [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => navigate(`/nha-may-cua-toi/purchase-requisitions/${req.id}`),
      },
    ];
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Đề xuất mua hàng</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Quản lý đề xuất mua hàng từ đơn hàng Misa
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
              onChange: setStatusFilter,
              options: [
                { value: "", label: "Tất cả trạng thái" },
                { value: "pending", label: "Chờ duyệt" },
                { value: "approved", label: "Đã duyệt" },
                { value: "rejected", label: "Từ chối" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
          ]}
          gridCols="sm:grid-cols-2"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập số đề xuất hoặc số đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const totalReqs = filteredRequisitions.length;
          const pendingCount = filteredRequisitions.filter(
            (r) => r.status === "pending"
          ).length;
          const approvedCount = filteredRequisitions.filter(
            (r) => r.status === "approved"
          ).length;
          return (
            <>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalReqs}</div>
                    <div className="text-sm text-gray-500">Tổng đề xuất</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
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
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{approvedCount}</div>
                    <div className="text-sm text-gray-500">Đã duyệt</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold">
            Danh sách đề xuất mua hàng
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
          ) : filteredRequisitions.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm">
              Không có đề xuất nào trong tháng {selectedMonth + 1} năm {selectedYear}
            </div>
          ) : (
            filteredRequisitions.map((req) => (
              <div
                key={req.id}
                className="p-4 space-y-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/nha-may-cua-toi/purchase-requisitions/${req.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 mb-2">
                      <span className="font-bold text-blue-600 text-base">
                        {req.requisitionNumber}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Đơn hàng:</span>{" "}
                          <span className="text-gray-900 font-medium">
                            {req.misaOrder?.orderNumber || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Người tạo:</span>{" "}
                          <span className="text-gray-900">
                            {req.createdBy?.user?.fullName || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500">Ngày tạo:</span>{" "}
                          <span className="text-gray-900">
                            {req.createdAt
                              ? format(new Date(req.createdAt), "dd/MM/yyyy")
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <ActionsDropdown actions={getActions(req)} />
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
                  Số đề xuất
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng Misa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
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
                  <td colSpan={6} className="px-4 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center">
                    Không có đề xuất nào trong tháng {selectedMonth + 1} năm {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/nha-may-cua-toi/purchase-requisitions/${req.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {req.requisitionNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{req.misaOrder?.orderNumber || "-"}</div>
                        {req.misaOrder?.customerName && (
                          <div className="text-xs text-gray-500">{req.misaOrder.customerName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.createdBy?.user?.fullName || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.createdAt
                        ? format(new Date(req.createdAt), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[200px]">
                        {getStatusBadge(req.status)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <ActionsDropdown actions={getActions(req)} />
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
    </div>
  );
}
