'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reps/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      const rep = data.rep;
      localStorage.setItem('currentRep', JSON.stringify({
        id: rep.id,
        name: rep.name,
        email: rep.email,
        distributorId: rep.distributorId
      }));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/');
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '480px', margin: '4rem auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src="/logo-full.png" alt="Pasalho DNP" style={{ height: '48px', width: 'auto', marginBottom: '1rem' }} />
      </div>
      <h1>Rep Sign In</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Sign in with your email and password</p>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', marginBottom: '1rem', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
      </div>

      <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 12, backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700 }}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      <div style={{ marginTop: 18, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6, color: '#666' }}>
        <p><strong>Demo credentials</strong></p>
        <p>Email: john@pasalho.com  Password: pass123</p>
      </div>
    </main>
  );
}
