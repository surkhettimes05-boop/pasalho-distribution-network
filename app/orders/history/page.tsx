'use client';

import { useEffect, useState } from 'react';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders/history', { headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } })
      .then(r => r.json()).then(data => { setOrders(data.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <main style={{ padding: 20 }}>Loading…</main>;

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h2>Order History</h2>
      {orders.length === 0 && <p>No orders found.</p>}
      {orders.map(o => (
        <div key={o.id} style={{ padding: 12, border: '1px solid #eee', marginBottom: 8, borderRadius: 6 }}>
          <div><strong>Order #{o.id}</strong> — {o.status} — {new Date(o.createdAt).toLocaleString()}</div>
          <div>Items: {JSON.stringify(o.items)}</div>
        </div>
      ))}
    </main>
  );
}
