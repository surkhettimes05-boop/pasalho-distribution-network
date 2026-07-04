'use client';

import { useState, useEffect } from 'react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setOrders(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    const token = localStorage.getItem('accessToken');
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ id, status: newStatus })
    });
    fetchOrders();
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/orders/export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `pasalho_orders_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: network error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>All Orders (Master View)</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '8px 18px',
            background: exporting ? '#94a3b8' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: exporting ? 'not-allowed' : 'pointer',
          }}
        >
          {exporting ? '⏳ Exporting...' : '📥 Export to Excel'}
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr style={{ background: '#ddd' }}>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Order ID</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Retailer</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Rep</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Items</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>Total (NPR)</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>#{o.id}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{new Date(o.createdAt).toLocaleString()}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  {o.retailerName}<br/>
                  <small style={{ color: '#666' }}>{o.retailerLocation}</small>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{o.repName || 'Self (Admin)'}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                    {o.items?.map((item: any, idx: number) => (
                      <li key={idx} style={{ fontSize: '0.85rem' }}>
                        {item.quantity}x {item.productName}
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold' }}>
                  {Number(o.totalAmount || 0).toLocaleString()}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                  <select 
                    value={o.status} 
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ padding: '4px' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
