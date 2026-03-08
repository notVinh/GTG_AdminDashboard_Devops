import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const {
    notifications,
    unseenCount,
    isLoading,
    fetchNotifications,
    fetchUnseenCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    permission,
    requestPermission
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Fetch notifications and count on mount - ONLY ONCE
  useEffect(() => {
    // Initial fetch - disabled to prevent continuous API calls
    // fetchNotifications();
    // fetchUnseenCount();

    // Polling disabled - uncomment below to enable periodic fetching
    // if (intervalRef.current) {
    //   clearInterval(intervalRef.current);
    // }
    // intervalRef.current = window.setInterval(() => {
    //   fetchNotifications();
    //   fetchUnseenCount();
    // }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependencies - chỉ chạy 1 lần khi mount!

  const handleClick = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Refresh data khi mở panel để có data mới nhất
    if (newIsOpen) {
      fetchNotifications();
      fetchUnseenCount();
    }
  };

  // Request permission if not granted
  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={handleClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />

        {/* Badge */}
        {unseenCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {/* Permission Request */}
      {permission === 'default' && (
        <div className="absolute right-0 top-12 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg w-64 z-50">
          <p className="text-sm text-yellow-800 mb-2">
            Bật thông báo để nhận cập nhật realtime
          </p>
          <button
            onClick={handleRequestPermission}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded"
          >
            Bật thông báo
          </button>
        </div>
      )}

      {/* Notification Panel */}
      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsAsRead}
        />
      )}
    </div>
  );
}
