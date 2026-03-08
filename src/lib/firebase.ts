import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';

// Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your_api_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your_auth_domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your_storage_bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your_messaging_sender_id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your_app_id"
};

// VAPID key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "your_vapid_key";

let app;
let messaging: Messaging | null = null;

try {
  app = initializeApp(firebaseConfig);

  // Check if messaging is supported (requires HTTPS or localhost)
  if ('serviceWorker' in navigator && 'Notification' in window) {
    messaging = getMessaging(app);
  } 
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
}

export { messaging };

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    return null;
  }

  try {
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
    } else if (Notification.permission === 'denied') {
      return null;
    } else {
      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        return null;
      }
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Wait for service worker to be active
    await navigator.serviceWorker.ready;

    // Ensure we have an active service worker
    if (!registration.active) {
      throw new Error('Service Worker is not active');
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      return token;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Listen for foreground messages (when app is open)
 */
export function onNotificationReceived(callback: (payload: any) => void) {
  if (!messaging) {
    return;
  }

  onMessage(messaging, (payload) => {
    callback(payload);
  });
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
