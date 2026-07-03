const CACHE_NAME = 'pasalho-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/orders/history',
  '/reps/profile'
];

// Installs and caches static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercepts network calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for API routes: Network first, fallback to Cache
  if (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/retailers')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response copy
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback from Cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Return default empty json if no cache matches
            return new Response(JSON.stringify({ products: [], retailers: [], offline: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Strategy for HTML and other static assets: Cache first, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((networkResponse) => {
          // Optionally cache dynamically loaded pages/assets
          if (
            networkResponse.status === 200 &&
            event.request.method === 'GET' &&
            !url.pathname.startsWith('/api/')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
      );
    })
  );
});
