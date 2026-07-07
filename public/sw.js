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

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncDraftOrders());
  }
});

async function syncDraftOrders() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pasalho-local', 1);
    req.onsuccess = async (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('drafts')) {
        resolve();
        return;
      }
      
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const draftsRequest = store.getAll();
      const keysRequest = store.getAllKeys();
      
      tx.oncomplete = async () => {
        const drafts = draftsRequest.result;
        const keys = keysRequest.result;
        
        if (!drafts || drafts.length === 0) {
          resolve();
          return;
        }

        try {
          // Attempt to sync all drafts
          for (let i = 0; i < drafts.length; i++) {
            const draft = drafts[i];
            const key = keys[i];
            
            // Assume draft contains the auth token or we rely on session
            // In a real PWA we'd need to ensure auth headers are passed correctly
            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Wait, service worker doesn't have the auth token if it's in localStorage.
                // We'll pass the token inside the draft payload for offline sync
                'Authorization': `Bearer ${draft._token || ''}`
              },
              body: JSON.stringify(draft.payload || draft)
            });
            
            if (res.ok) {
              // Delete from indexedDB upon successful sync
              const delTx = db.transaction('drafts', 'readwrite');
              delTx.objectStore('drafts').delete(key);
              await new Promise(r => delTx.oncomplete = r);
            } else if (res.status >= 400 && res.status < 500) {
              // Business logic error (e.g. stock out). Mark as error so UI can show it.
              let errorMsg = 'Validation Error';
              try {
                const data = await res.json();
                if (data.error) errorMsg = data.error;
              } catch (e) {}
              
              const updateTx = db.transaction('drafts', 'readwrite');
              const store = updateTx.objectStore('drafts');
              draft.syncError = errorMsg;
              store.put(draft, key);
              await new Promise(r => updateTx.oncomplete = r);
            }
          }
          resolve();
        } catch (err) {
          console.error('Background sync failed:', err);
          reject(err);
        }
      };
    };
    req.onerror = () => reject(req.error);
  });
}
