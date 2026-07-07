// Simple IndexedDB wrapper for queued orders (client-side). Use only in browser.
export async function saveDraftOrder(key: string, data: any) {
  if (typeof window === 'undefined') return;
  const db = await openDB();
  const tx = db.transaction('drafts', 'readwrite');
  tx.objectStore('drafts').put(data, key);
  await tx.complete;

  // Request background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const sw = await navigator.serviceWorker.ready;
      await (sw as any).sync.register('sync-orders');
      console.log('Background sync registered for draft order');
    } catch (err) {
      console.error('Failed to register background sync:', err);
    }
  }
}

export async function getDraftOrders() {
  if (typeof window === 'undefined') return [];
  const db = await openDB();
  const tx = db.transaction('drafts', 'readonly');
  const all = await tx.objectStore('drafts').getAll();
  await tx.complete;
  return all;
}

export async function updateDraftError(key: string, errorMsg: string) {
  const db = await openDB();
  const tx = db.transaction('drafts', 'readwrite');
  const store = tx.objectStore('drafts');
  const draft = await store.get(key);
  if (draft) {
    draft.syncError = errorMsg;
    store.put(draft, key);
  }
  await tx.complete;
}

export async function deleteDraftOrder(key: string) {
  if (typeof window === 'undefined') return;
  const db = await openDB();
  const tx = db.transaction('drafts', 'readwrite');
  tx.objectStore('drafts').delete(key);
  await tx.complete;
}

export async function clearDraftOrders() {
  if (typeof window === 'undefined') return;
  const db = await openDB();
  const tx = db.transaction('drafts', 'readwrite');
  tx.objectStore('drafts').clear();
  await tx.complete;
}

function openDB() {
  return new Promise<any>((resolve, reject) => {
    const req = indexedDB.open('pasalho-local', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
