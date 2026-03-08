import { useEffect } from 'react';
import { X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../api/notification';

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onClose: () => void;
  onMarkAsRead: (notificationId: string | number) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export function NotificationPanel({
  notifications,
  isLoading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationPanelProps) {
  const navigate = useNavigate();

  // Close panel when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Skip on mobile (screen width < 640px)
      if (window.innerWidth < 640) return;

      const target = e.target as HTMLElement;
      if (!target.closest('.notification-panel')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
      await onMarkAsRead(notification.id);
    }

    // Navigate to detail page
    const path = getNavigationPath(notification);
    if (path) {
      navigate(path);
      onClose(); // Close panel after navigating
    }
  };

  const handleMarkAllAsRead = async () => {
    await onMarkAllAsRead();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="notification-panel fixed sm:absolute right-0 sm:right-0 top-0 sm:top-12 left-0 sm:left-auto w-full sm:w-96 bg-white border-0 sm:border border-gray-200 rounded-none sm:rounded-lg shadow-xl z-50 h-full sm:h-auto sm:max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h3 className="text-lg sm:text-lg font-semibold text-gray-900">Thông báo</h3>
        <div className="flex items-center gap-2 sm:gap-2">
          {notifications.some(n => n.statusCd === 0) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer p-2 sm:p-0"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer p-2 sm:p-0"
          >
            <X className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="w-12 h-12 mb-2 text-gray-300" />
            <p>Không có thông báo</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
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
                    <h4 className={`text-sm font-medium text-gray-900 ${
                      notification.statusCd === 0 ? 'font-semibold' : ''
                    }`}>
                      {notification.title}
                    </h4>

                    {/* Body */}
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.body}
                    </p>

                    {/* Time */}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: vi
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 sm:p-3 border-t border-gray-200 text-center bg-white sticky bottom-0 z-10">
          <button
            onClick={() => {
              navigate('/thong-bao');
              onClose();
            }}
            className="text-sm sm:text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer py-2 sm:py-0"
          >
            Xem tất cả
          </button>
        </div>
      )}
      </div>
    </>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
