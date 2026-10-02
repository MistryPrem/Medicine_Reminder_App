// CareSync Web Push Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Medication Reminder', body: event.data.text() };
    }
  }

  const title = data.title || 'CareSync Medication Alert';
  const options = {
    body: data.body || 'It is time for your scheduled medication.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || 'medication-reminder',
    renotify: true,
    requireInteraction: true,
    data: data.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/personal-reminders');
      }
    })
  );
});
