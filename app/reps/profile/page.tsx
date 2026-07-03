'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [rep, setRep] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reps/me', { headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } })
      .then(r => r.json()).then(data => {
        if (data.rep) {
          setRep(data.rep);
          setName(data.rep.name || '');
          setPhone(data.rep.phone || '');
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    await fetch('/api/reps/me', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('accessToken') }, body: JSON.stringify({ name, phone }) });
    setRep({ ...rep, name, phone });
  };

  if (loading) return <main style={{ padding: 20 }}>Loading…</main>;

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>My Profile</h2>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Phone</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <button onClick={save} style={{ padding: 10, background: '#0070f3', color: 'white', border: 'none', borderRadius: 6 }}>Save</button>
    </main>
  );
}
