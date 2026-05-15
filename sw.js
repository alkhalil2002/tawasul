// Service Worker — Cache-first strategy for instant loads
const CACHE = 'tawasul-v3';
const ASSETS = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/manifest.json'];

// تثبيت: اعمل cache فوري للأصول الأساسية
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

// تفعيل: امسح cache قديم
self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Asset links لـ Android Trusted Web Activity
  if (url.includes('/.well-known/assetlinks.json')) {
    e.respondWith(new Response(
      '[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"com.tawasul.app","sha256_cert_fingerprints":["4D:99:5B:01:4A:A7:DC:8E:F4:C8:BD:1E:DA:A3:52:1E:ED:AA:17:8A:EC:8F:7B:55:CC:C7:B9:8A:2B:8F:44:71"]}}]',
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    ));
    return;
  }

  // Supabase API — لا نخزن، طلبات شبكة مباشرة
  if (url.includes('supabase.co')) return;

  // طلبات GET فقط
  if (e.request.method !== 'GET') return;

  // Cache-first: نرجع من cache فوراً، ونحدّث في الخلفية (stale-while-revalidate)
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        // حدّث في الخلفية لو موجود
        const fetchAndCache = fetch(e.request).then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            cache.put(e.request, resp.clone()).catch(()=>{});
          }
          return resp;
        }).catch(() => cached);

        // ارجع cache فوراً لو موجود، وإلا انتظر الـ fetch
        return cached || fetchAndCache;
      })
    )
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
  e.waitUntil(self.clients.openWindow('/'));
});
