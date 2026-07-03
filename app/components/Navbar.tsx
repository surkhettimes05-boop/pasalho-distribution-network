'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateRep = () => {
      const repData = localStorage.getItem('currentRep');
      if (repData) {
        try {
          setCurrentRep(JSON.parse(repData));
        } catch (e) {
          setCurrentRep(null);
        }
      } else {
        setCurrentRep(null);
      }
    };
    updateRep();
    // Add event listener to capture sign-in changes immediately
    window.addEventListener('storage', updateRep);
    return () => window.removeEventListener('storage', updateRep);
  }, [pathname]);

  if (!mounted || !currentRep) return null;

  const handleSignOut = () => {
    localStorage.removeItem('currentRep');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  const links = [
    { label: 'Capture Orders', href: '/' },
    { label: 'Order History', href: '/orders/history' },
    { label: 'Profile', href: '/reps/profile' },
  ];

  const isAdmin = currentRep.role === 'admin' || currentRep.email === 'john@pasalho.com'; // Admin indicator

  return (
    <header style={{
      background: 'rgba(30, 27, 75, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 2rem',
      fontFamily: "'Outfit', sans-serif",
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href="/" style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textDecoration: 'none',
          letterSpacing: '-0.025em',
          transition: 'opacity 0.2s'
        }}>
          Pasalho DNP
        </Link>

        <nav style={{ display: 'flex', gap: '1rem' }}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#a78bfa' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin/backup"
              style={{
                color: pathname === '/admin/backup' ? '#f472b6' : '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: pathname === '/admin/backup' ? 'rgba(244, 114, 182, 0.15)' : 'transparent',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              DB Backup (Admin)
            </Link>
          )}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{currentRep.name}</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{isAdmin ? 'Administrator' : 'Sales Rep'}</span>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
