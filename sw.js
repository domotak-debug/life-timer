// Service Worker - キャッシュなし（GitHub Pages サブパス対応）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});
// キャッシュせず常にネットワークから取得
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
