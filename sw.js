const CACHE = 'tawasol-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  // Serve assetlinks.json for TWA verification
  if (e.request.url.includes('/.well-known/assetlinks.json')) {
    e.respondWith(new Response(
      '[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"com.tawasul.app","sha256_cert_fingerprints":["4D:99:5B:01:4A:A7:DC:8E:F4:C8:BD:1E:DA:A3:52:1E:ED:AA:17:8A:EC:8F:7B:55:CC:C7:B9:8A:2B:8F:44:71"]}}]',
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    ));
    return;
  }
  if (e.request.url.includes('supabase.co')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'تواصل', {
      body: data.body || 'رسالة جديدة',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: data
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
