// Service Worker for Push Notifications
// File: public/sw.js

const CACHE_NAME = 'conference-app-v1';
const STATIC_CACHE = [
  '/',
  '/icons/notification-icon.png',
  '/icons/notification-badge.png',
  '/icons/session-reminder.png',
  '/icons/message.png',
  '/icons/urgent.png',
  '/icons/certificate.png',
  '/icons/event-update.png',
  '/icons/networking.png',
  '/icons/test.png',
  '/icons/view.png',
  '/icons/attendance.png',
  '/icons/download.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE);
      })
      .catch((error) => {
        console.error('Service Worker: Caching failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.error('Service Worker: Fetch failed', error);
        // Return a default offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icons/notification-icon.png',
    badge: '/icons/notification-badge.png',
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image,
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate,
        actions: data.actions || [],
        data: data.data || {}
      };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: notificationData.vibrate,
      actions: notificationData.actions,
      data: notificationData.data
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  event.waitUntil(
    (async () => {
      // Get all clients (open tabs/windows)
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // Handle different actions
      let targetUrl = '/';

      if (action) {
        // Handle action button clicks
        switch (action) {
          case 'view_session':
            if (data.sessionId) {
              targetUrl = `/sessions/${data.sessionId}`;
            }
            break;
          case 'mark_attendance':
            if (data.sessionId) {
              targetUrl = `/attendance?session=${data.sessionId}`;
            }
            break;
          case 'download_certificate':
            if (data.certificateId) {
              targetUrl = `/certificates/${data.certificateId}/download`;
            }
            break;
          default:
            targetUrl = '/dashboard';
        }
      } else {
        // Handle main notification click
        if (data.action) {
          switch (data.action) {
            case 'open_session':
              if (data.sessionId) {
                targetUrl = `/sessions/${data.sessionId}`;
              }
              break;
            case 'open_dashboard':
              targetUrl = '/dashboard';
              break;
            case 'mark_attendance':
              if (data.sessionId) {
                targetUrl = `/attendance?session=${data.sessionId}`;
              }
              break;
            default:
              if (data.url) {
                targetUrl = data.url;
              }
          }
        }
      }

      // Try to focus existing tab with the target URL
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(targetUrl, self.location.origin);
        
        if (clientUrl.pathname === targetUrlObj.pathname) {
          await client.focus();
          // Send message to client about the notification click
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: {
              action,
              notificationData: data,
              targetUrl
            }
          });
          return;
        }
      }

      // If no existing tab found, open new one
      await self.clients.openWindow(new URL(targetUrl, self.location.origin).href);
    })()
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification close', event);

  const notification = event.notification;
  const data = notification.data || {};

  // Send message to all clients about notification close
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_CLOSE',
          data: {
            notificationData: data
          }
        });
      });
    })
  );
});

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);

  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(
      // Handle background sync for notifications
      handleBackgroundSync()
    );
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get stored notifications from IndexedDB or localStorage
    const storedNotifications = await getStoredNotifications();
    
    if (storedNotifications.length > 0) {
      // Send stored notifications to server
      for (const notification of storedNotifications) {
        try {
          await sendNotificationToServer(notification);
          await removeStoredNotification(notification.id);
        } catch (error) {
          console.error('Failed to sync notification:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for notification storage
async function getStoredNotifications() {
  try {
    // This would typically use IndexedDB
    // For now, return empty array as example
    return [];
  } catch (error) {
    console.error('Failed to get stored notifications:', error);
    return [];
  }
}

async function sendNotificationToServer(notification) {
  const response = await fetch('/api/notifications/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification)
  });

  if (!response.ok) {
    throw new Error('Failed to sync notification');
  }

  return response.json();
}

async function removeStoredNotification(notificationId) {
  try {
    // Remove from storage
    // Implementation would depend on storage method
    console.log('Removed stored notification:', notificationId);
  } catch (error) {
    console.error('Failed to remove stored notification:', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event);

  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
    case 'CACHE_NOTIFICATION_ICONS':
      // Cache notification icons
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          if (data.icons && Array.isArray(data.icons)) {
            return cache.addAll(data.icons);
          }
        })
      );
      break;
    case 'CLEAR_NOTIFICATIONS':
      // Clear all notifications with specific tag
      event.waitUntil(
        self.registration.getNotifications({ tag: data.tag }).then((notifications) => {
          notifications.forEach((notification) => {
            notification.close();
          });
        })
      );
      break;
    default:
      console.log('Unknown message type:', type);
  }

  // Send response back to client
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ type: 'ACK', data: { originalType: type } });
  }
});

// Error event
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event);
});

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled rejection', event);
});

console.log('Service Worker: Script loaded successfully');