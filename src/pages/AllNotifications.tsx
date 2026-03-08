import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, isToday, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../api/notification';
import Pagination from '../components/commons/Pagination';

interface GroupedNotifications {
  newest: Notification[];
  today: Notification[];
  earlier: Notification[];
}

export default function AllNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications(page, limit);
      setNotifications(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group notifications
  const groupedNotifications = useMemo((): GroupedNotifications => {
    const newest: Notification[] = [];
    const today: Notification[] = [];
    const earlier: Notification[] = [];

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);

      // Mới nhất: chưa đọc (statusCd === 0)
      if (notification.statusCd === 0) {
        newest.push(notification);
      }
      // Hôm nay: đã đọc và là hôm nay
      else if (notification.statusCd === 1 && isToday(notificationDate)) {
        today.push(notification);
      }
      // Trước đó: tất cả thông báo hôm trước
      else {
        earlier.push(notification);
      }
    });

    return { newest, today, earlier };
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string | number) => {
    try {
      await markAsRead(Number(notificationId));
      setNotifications(prev =>
        prev.map(n => String(n.id) === String(notificationId) ? { ...n, statusCd: 1 } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, statusCd: 1 })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNavigationPath = (notification: Notification): string | null => {
    const { type, referenceId } = notification;

    if (!referenceId) return null;

    switch (type) {
      case 'leave_request_created':
      case 'leave_request_approved':
      case 'leave_request_rejected':
        return `/nha-may-cua-toi/quan-ly-phep?detailId=${referenceId}`;

      case 'overtime_created':
      case 'overtime_approved':
      case 'overtime_rejected':
        return `/nha-may-cua-toi/quan-ly-tang-ca?detailId=${referenceId}`;

      case 'employee_feedback_created':
      case 'employee_feedback_replied':
      case 'employee_feedback_reassigned':
        return `/nha-may-cua-toi/gop-y?detailId=${referenceId}`;

      case 'arrival_report_created':
        return `/nha-may-cua-toi/bao-den-nha-may?detailId=${referenceId}`;

      case 'maintenance_report_created':
      case 'maintenance_report_resolved':
      case 'maintenance_report_reassigned':
        return `/nha-may-cua-toi/bao-may-hong?detailId=${referenceId}`;

      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unseen
    if (notification.statusCd === 0) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to detail page
    const path = getNavigationPath(notification);
    if (path) {
      navigate(path);
    }
  };

  const unseenCount = groupedNotifications.newest.length;
  const totalNotifications = groupedNotifications.newest.length + groupedNotifications.today.length + groupedNotifications.earlier.length;

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        notification.statusCd === 0 ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        {notification.statusCd === 0 && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4
            className={`text-sm font-medium text-gray-900 ${
              notification.statusCd === 0 ? 'font-semibold' : ''
            }`}
          >
            {notification.title}
          </h4>

          {/* Body */}
          <p className="text-sm text-gray-600 mt-1">
            {notification.body}
          </p>

          {/* Time */}
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Tất cả thông báo</h1>
          </div>

          {/* Mark All as Read */}
          {unseenCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex items-center justify-center">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          </div>
        ) : totalNotifications === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Bell className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg">Không có thông báo</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mới nhất - Chưa đọc */}
            {groupedNotifications.newest.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Mới nhất ({groupedNotifications.newest.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedNotifications.newest.map(renderNotificationItem)}
                </div>
              </div>
            )}

            {/* Hôm nay - Đã đọc */}
            {groupedNotifications.today.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Hôm nay ({groupedNotifications.today.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedNotifications.today.map(renderNotificationItem)}
                </div>
              </div>
            )}

            {/* Trước đó - Cũ hơn */}
            {groupedNotifications.earlier.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Trước đó ({groupedNotifications.earlier.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedNotifications.earlier.map(renderNotificationItem)}
                </div>
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <Pagination
                  page={page}
                  limit={limit}
                  total={total}
                  onPageChange={setPage}
                  onLimitChange={() => {}}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
