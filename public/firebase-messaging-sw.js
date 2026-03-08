// Firebase Cloud Messaging Service Worker
// This file handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config (same as in firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyD2Y5bGDPDnustCdgSvLYbjJjwByAQtEHY",
  authDomain: "gtg-hrm.firebaseapp.com",
  projectId: "gtg-hrm",
  storageBucket: "gtg-hrm.firebasestorage.app",
  messagingSenderId: "1959354057",
  appId: "1:1959354057:web:0631a3997b4f3f1b717718"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (when app is closed or not in focus)
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png',
    badge: '/badge.png',
    data: {
      url: payload.data?.url || '/',
      type: payload.data?.type,
      referenceId: payload.data?.referenceId,
    },
    tag: payload.data?.type || 'default',
    requireInteraction: false,
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || '/';

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
