const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Notification {
  id: string | number;
  title: string;
  body: string;
  type?: string;
  referenceId?: string | number;
  metadata?: Record<string, any>;
  statusCd: number; // 0: unseen, 1: seen
  createdAt: string;
  userId?: string;
  notificationTokenIds?: string[];
}

export interface NotificationListResponse {
  data: {
    data: Notification[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  message: string;
  statusCode: number;
}

/**
 * Register FCM token with backend
 */
export async function registerFcmToken(token: string): Promise<void> {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    console.warn('[API] No auth token found');
    return;
  }

  const response = await fetch(`${API_URL}/notification/accept-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ fcmToken: token })
  });

  if (!response.ok) {
    throw new Error('Failed to register FCM token');
  }

  console.log('[API] FCM token registered successfully');
}

/**
 * Get notifications list
 */
export async function getNotifications(page: number = 1, limit: number = 20): Promise<NotificationListResponse> {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_URL}/notification?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Get unseen notifications count
 */
export async function getUnseenCount(): Promise<number> {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    return 0;
  }

  const response = await fetch(`${API_URL}/notification/count-unseen`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.data?.count || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: number): Promise<void> {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_URL}/notification/read-one/${notificationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_URL}/notification/read-all`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_URL}/notification/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
}
