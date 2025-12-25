// Custom Service Worker for background notifications

let notificationInterval = null;
let currentTime = 0;
let isRunning = false;

// Format time helper
function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
}

// Show notification
async function showStopwatchNotification(timeMs) {
  const { hours, minutes, seconds } = formatTime(timeMs);
  const timeString = `${hours}:${minutes}:${seconds}`;

  try {
    await self.registration.showNotification('Stopwatch Running', {
      body: `Elapsed: ${timeString}`,
      icon: '/stopwatch/icon-192.png',
      badge: '/stopwatch/icon-192.png',
      tag: 'stopwatch-persistent',
      silent: true,
      requireInteraction: true,
      renotify: true,
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'stop', title: 'Stop' }
      ]
    });
  } catch (e) {
    console.warn('[SW] Failed to show notification:', e);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, time, running, startTimestamp, accumulatedTime } = event.data;

  if (type === 'STOPWATCH_UPDATE') {
    isRunning = running;

    if (running) {
      // Calculate current time based on start timestamp
      const startTs = startTimestamp || Date.now();
      const accumulated = accumulatedTime || 0;

      // Clear existing interval
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }

      // Show immediate notification
      const currentTimeMs = accumulated + (Date.now() - startTs);
      showStopwatchNotification(currentTimeMs);

      // Update notification every 1 second
      notificationInterval = setInterval(() => {
        const updatedTime = accumulated + (Date.now() - startTs);
        showStopwatchNotification(updatedTime);
      }, 1000);
    } else {
      // Stop notifications
      if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
      }
      // Close notification
      self.registration.getNotifications({ tag: 'stopwatch-persistent' }).then(notifications => {
        notifications.forEach(n => n.close());
      });
    }
  }

  if (type === 'STOP_NOTIFICATIONS') {
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
    self.registration.getNotifications({ tag: 'stopwatch-persistent' }).then(notifications => {
      notifications.forEach(n => n.close());
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'stop') {
    // Broadcast stop message to all clients
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'STOP_STOPWATCH' });
      });
    });

    // Stop notification updates
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  } else {
    // Open or focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // If a client is already open, focus it
        for (const client of clients) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Clean up on service worker termination
self.addEventListener('activate', (event) => {
  console.log('[SW] Custom service worker activated');
});
