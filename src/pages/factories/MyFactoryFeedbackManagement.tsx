import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { employeeFeedbackApi } from "../../api/employee-feedback";
import { employeeApi } from "../../api/employee";
import type {
  EmployeeFeedback,
  FeedbackStatus,
  FeedbackPriority,
} from "../../types";
import { Button } from "../../components/ui/button";
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Eye,
  Search,
  Trash2,
} from "lucide-react";
import Pagination from "../../components/commons/Pagination";
import FeedbackDetailModal from "../../components/FeedbackDetailModal";
import FeedbackReplyModal from "../../components/FeedbackReplyModal";
import FilterSection from "../../components/commons/FilterSection";
import ActionsDropdown from "../../components/commons/ActionsDropdown";
import StatisticsCards from "../../components/commons/StatisticsCards";

interface EmployeeFeedbackStatistics {
  total: number;
  byStatus: {
    pending: number;
    replied: number;
  };
  unviewed: number;
}

export default function MyFactoryFeedbackManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [items, setItems] = useState<EmployeeFeedback[]>([]);
  const [statistics, setStatistics] = useState<EmployeeFeedbackStatistics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [unviewedOnly, setUnviewedOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<EmployeeFeedback | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);

  // Auto-open detail modal from notification
  useEffect(() => {
    const detailId = searchParams.get('detailId');
    if (detailId && items.length > 0) {
      const item = items.find(i => String(i.id) === detailId);
      if (item) {
        setSelectedFeedback(item);
        setShowDetailModal(true);
        // Remove detailId from URL
        searchParams.delete('detailId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, items, setSearchParams]);

  // Get current employee info
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted && me) {
          setFactoryId(Number((me as any).factoryId));
          setEmployeeId(Number((me as any).id));
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch feedback from server with filters
  useEffect(() => {
    (async () => {
      if (!factoryId) return;

      setLoading(true);
      try {
        const query: any = {
          page,
          limit,
        };

        if (statusFilter !== "all") query.status = statusFilter;
        if (priorityFilter !== "all") query.priority = priorityFilter;
        if (unviewedOnly) query.unviewedOnly = true;

        const feedbackRes = await employeeFeedbackApi.getByFactory(factoryId, query);
        setItems(feedbackRes.data);
        setTotal(feedbackRes.meta.total);

        // Calculate statistics from filtered data
        const stats = {
          total: feedbackRes.meta.total,
          byStatus: {
            pending: 0,
            replied: 0,
          },
          unviewed: 0,
        };

        feedbackRes.data.forEach((item) => {
          if (item.status === 'pending') stats.byStatus.pending++;
          else if (item.status === 'replied') stats.byStatus.replied++;
          if (!item.viewedAt) stats.unviewed++;
        });

        setStatistics(stats);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId, page, limit, statusFilter, priorityFilter, unviewedOnly]);

  // Reset page when server filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, unviewedOnly, limit]);


  // Handle view feedback detail
  const handleViewDetail = async (feedback: EmployeeFeedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);

    // Mark as viewed if not already
    if (!feedback.viewedAt) {
      try {
        await employeeFeedbackApi.markAsViewed(feedback.id);
        window.location.reload();
      } catch (error) {
        console.error("Failed to mark as viewed:", error);
      }
    }
  };

  // Handle reply to feedback
  const handleReply = async (feedback: EmployeeFeedback) => {
    setSelectedFeedback(feedback);
    setShowReplyModal(true);
  };

  // Handle update status
  const handleUpdateStatus = async (id: number, status: FeedbackStatus) => {
    try {
      await employeeFeedbackApi.update(id, { status });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Get status badge classes
  const getStatusBadgeClass = (status: FeedbackStatus) => {
    const config = {
      pending: "bg-yellow-100 text-yellow-800",
      replied: "bg-green-100 text-green-800",
    };
    return config[status] || config.pending;
  };

  // Get status label
  const getStatusLabel = (status: FeedbackStatus) => {
    const labels = {
      pending: "Chờ xử lý",
      replied: "Đã phản hồi",
    };
    return labels[status] || status;
  };

  // Get actions for dropdown
  const getActions = (feedback: EmployeeFeedback) => {
    const actions = [
      {
        label: "Xem chi tiết",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => handleViewDetail(feedback),
      },
    ];

    if (feedback.status === "pending") {
      actions.push({
        label: "Phản hồi",
        icon: <MessageSquare className="h-4 w-4" />,
        onClick: () => handleReply(feedback),
      });
    }

    return actions;
  };

  // Get priority label
  const getPriorityLabel = (priority: FeedbackPriority) => {
    const labels = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      urgent: "Khẩn cấp",
    };
    return labels[priority] || priority;
  };

  // Get priority color
  const getPriorityColor = (priority: FeedbackPriority) => {
    const colors = {
      low: "text-gray-500",
      medium: "text-blue-500",
      high: "text-orange-500",
      urgent: "text-red-500",
    };
    return colors[priority] || colors.medium;
  };

  // Filter items using useMemo
  // Client-side search filter only
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const search = searchTerm.toLowerCase();
    return items.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const content = item.content?.toLowerCase() || "";
      const employeeName = item.employee?.user?.fullName?.toLowerCase() || "";

      return (
        title.includes(search) ||
        content.includes(search) ||
        employeeName.includes(search)
      );
    });
  }, [items, searchTerm]);

  // Use filtered items for display
  const displayItems = useMemo(() => {
    return filteredItems;
  }, [filteredItems]);

  // Update statistics based on filtered items
  const filteredStatistics = useMemo(() => {
    const stats = {
      total: filteredItems.length,
      byStatus: {
        pending: 0,
        replied: 0,
      },
      unviewed: 0,
    };

    filteredItems.forEach((item) => {
      if (item.status === 'pending') stats.byStatus.pending++;
      else if (item.status === 'replied') stats.byStatus.replied++;

      if (!item.viewedAt) stats.unviewed++;
    });

    return stats;
  }, [filteredItems]);

  // Check if any filters are active
  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    unviewedOnly ||
    searchTerm.trim() !== "";

  if (loading && items.length === 0) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý đơn góp ý</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Xem và phản hồi các đơn góp ý từ nhân viên
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
                { value: "all", label: "Tất cả trạng thái" },
                { value: "pending", label: "Chờ xử lý" },
                { value: "replied", label: "Đã phản hồi" },
              ],
            },
            {
              type: "select",
              label: "Mức độ",
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: "all", label: "Tất cả mức độ" },
                { value: "low", label: "Thấp" },
                { value: "medium", label: "Trung bình" },
                { value: "high", label: "Cao" },
                { value: "urgent", label: "Khẩn cấp" },
              ],
            },
            {
              type: "checkbox",
              label: "Chỉ hiện chưa xem",
              value: unviewedOnly,
              onChange: setUnviewedOnly,
            },
          ]}
          gridCols="sm:grid-cols-3"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, nội dung, tên nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            setUnviewedOnly(false);
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Statistics Cards */}
      <StatisticsCards
        cards={[
          {
            value: filteredStatistics.total,
            label: "Tổng góp ý",
            icon: <MessageSquare className="h-5 w-5" />,
            bgColor: "blue",
          },
          {
            value: filteredStatistics.byStatus.pending,
            label: "Chờ xử lý",
            icon: <AlertCircle className="h-5 w-5" />,
            bgColor: "yellow",
          },
          {
            value: filteredStatistics.byStatus.replied,
            label: "Đã phản hồi",
            icon: <CheckCircle2 className="h-5 w-5" />,
            bgColor: "green",
          },
        ]}
        gridCols="md:grid-cols-3"
      />

      {/* Feedback Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold">Danh sách Góp ý</h2>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {displayItems.map((feedback) => (
            <div key={feedback.id} className={`p-4 space-y-3 ${!feedback.viewedAt ? "bg-blue-50" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{feedback.title}</span>
                    {!feedback.viewedAt && (
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                        Mới
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-500">Từ:</span>{" "}
                      <strong>{feedback.employee?.user?.fullName || "Ẩn danh"}</strong>
                    </div>
                    {feedback.employee?.department && (
                      <div>
                        <span className="text-gray-500">Phòng ban:</span> {feedback.employee.department?.name || '-'}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Ngày:</span>{" "}
                      {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(feedback.status)}`}
                      >
                        {getStatusLabel(feedback.status)}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                        {getPriorityLabel(feedback.priority)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <ActionsDropdown actions={getActions(feedback)} />
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
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người gửi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mức độ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày gửi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayItems.map((feedback) => (
                <tr
                  key={feedback.id}
                  className={`hover:bg-gray-50 ${!feedback.viewedAt ? "bg-blue-50" : ""}`}
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1">{feedback.title}</span>
                      {!feedback.viewedAt && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                          Mới
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {feedback.employee?.user?.fullName || "Ẩn danh"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {feedback.employee?.department?.name || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getPriorityColor(feedback.priority)}`}>
                      {getPriorityLabel(feedback.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(feedback.status)}`}
                    >
                      {getStatusLabel(feedback.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end">
                      <ActionsDropdown actions={getActions(feedback)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!displayItems.length && !loading && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm.trim() ? "Không tìm thấy kết quả phù hợp" : "Không có góp ý"}
          </div>
        )}

        {loading && (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        )}

        <Pagination
          page={page}
          limit={limit}
          total={searchTerm.trim() ? filteredItems.length : total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Modals */}
      {showDetailModal && selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedFeedback(null);
          }}
          onStatusChange={(status) => {
            handleUpdateStatus(selectedFeedback.id, status);
            setShowDetailModal(false);
          }}
          onReply={() => {
            setShowDetailModal(false);
            setShowReplyModal(true);
          }}
        />
      )}

      {showReplyModal && selectedFeedback && (
        <FeedbackReplyModal
          feedback={selectedFeedback}
          employeeId={employeeId}
          onClose={() => {
            setShowReplyModal(false);
            setSelectedFeedback(null);
          }}
          onSuccess={() => {
            setShowReplyModal(false);
            setSelectedFeedback(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
