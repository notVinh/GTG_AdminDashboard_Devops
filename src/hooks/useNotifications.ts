import { useEffect, useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  onNotificationReceived,
  isNotificationSupported,
  getNotificationPermission
} from '../lib/firebase';
import {
  registerFcmToken,
  getNotifications,
  getUnseenCount,
  markAsRead,
  markAllAsRead,
  type Notification
} from '../api/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Initialize Firebase and register FCM token
  useEffect(() => {
    const initializeNotifications = async () => {
      // Check if notifications are supported
      const supported = isNotificationSupported();
      setIsSupported(supported);

      if (!supported) {
        console.warn('[Notifications] Not supported in this browser');
        return;
      }

      // Check current permission
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      // Request permission and register token
      const token = await requestNotificationPermission();

      if (token) {
        // Check if token is already registered
        const savedToken = localStorage.getItem('fcm_token');
        if (savedToken === token) {
          setPermission('granted');
          return;
        }

        try {
          await registerFcmToken(token);
          localStorage.setItem('fcm_token', token);
          setPermission('granted');
        } catch (error) {
          console.error('[Notifications] Failed to register FCM token:', error);
        }
      }
    };

    initializeNotifications();
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
    setIsLoading(true);
    try {
      const response = await getNotifications(page, limit);
      setNotifications(response.data.data);
    } catch (error) {
      console.error('[Notifications] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unseen count
  const fetchUnseenCount = useCallback(async () => {
    try {
      const count = await getUnseenCount();
      setUnseenCount(count);
    } catch (error) {
      console.error('[Notifications] Failed to fetch unseen count:', error);
    }
  }, []);

  // Listen for foreground notifications
  useEffect(() => {
    if (!isSupported) return;

    onNotificationReceived((payload) => {
      // Show browser notification if permission granted
      if (permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/icon.png',
        });
      }

      // Update local state instead of calling API
      // Tăng unseenCount thay vì call API getUnseenCount()
      setUnseenCount(prev => prev + 1);

      // Không cần call fetchNotifications() vì:
      // 1. User sẽ thấy notification từ browser popup
      // 2. Interval sẽ tự động refresh sau 60s
      // 3. Khi user mở panel, có thể gọi fetchNotifications() lúc đó
    });
  }, [isSupported, permission]);

  // Mark as read
  const markNotificationAsRead = useCallback(async (notificationId: string | number) => {
    try {
      await markAsRead(Number(notificationId));

      // Update local state
      setNotifications(prev =>
        prev.map(n => String(n.id) === String(notificationId) ? { ...n, statusCd: 1 } : n)
      );
      setUnseenCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Notifications] Failed to mark as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, statusCd: 1 }))
      );
      setUnseenCount(0);
    } catch (error) {
      console.error('[Notifications] Failed to mark all as read:', error);
    }
  }, []);

  // Request permission manually
  const requestPermission = useCallback(async () => {
    const token = await requestNotificationPermission();

    if (token) {
      // Check if token is already registered
      const savedToken = localStorage.getItem('fcm_token');
      if (savedToken === token) {
        setPermission('granted');
        return;
      }

      try {
        await registerFcmToken(token);
        localStorage.setItem('fcm_token', token);
        setPermission('granted');
      } catch (error) {
        console.error('[Notifications] Failed to register FCM token:', error);
      }
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    notifications,
    unseenCount,
    isLoading,
    isSupported,
    permission,
    fetchNotifications,
    fetchUnseenCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    requestPermission,
  };
}
