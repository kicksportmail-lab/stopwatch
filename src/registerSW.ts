import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline');
  },
  onRegistered(r) {
    console.log('[PWA] Service Worker registered:', r);
  },
  onRegisterError(error) {
    console.error('[PWA] Service Worker registration error:', error);
  },
});

// Check for updates every hour
setInterval(() => {
  updateSW(true);
}, 60 * 60 * 1000);

export { updateSW };
