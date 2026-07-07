'use client';

import { useState, useEffect } from 'react';

export default function AdminRetailers() {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  const fetchRetailers = async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/admin/retailers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setRetailers(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const method = editingId ? 'PUT' : 'POST';
    const body = { id: editingId, name, location, phone };

    await fetch('/api/admin/retailers', {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(body)
    });
    
    setShowForm(false);
    setEditingId(null);
    setName(''); setLocation(''); setPhone('');
    fetchRetailers();
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setName(r.name);
    setLocation(r.location);
    setPhone(r.phone);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
        <h2>Manage Retailers</h2>
        <button onClick={() => setShowForm(true)}>Add Retailer</button>
      </div>

      {showForm && (
        <div style={{ background: '#eee', padding: '1rem', marginBottom: '1rem', border: '1px solid #ccc' }}>
          <h3>{editingId ? 'Edit Retailer' : 'New Retailer'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block' }}>Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Location</label>
              <input required value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Phone</label>
              <input required value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ background: '#ddd' }}>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Location</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Phone</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {retailers.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{r.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{r.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{r.location}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{r.phone}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    <button onClick={() => handleEdit(r)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
