'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!mounted || !currentRep) return null;

  const handleSignOut = () => {
    localStorage.removeItem('currentRep');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  const links = [
    { label: '📋 Capture Orders', href: '/' },
    { label: '📦 Order History', href: '/orders/history' },
    { label: '👤 Profile', href: '/reps/profile' },
  ];

  const isAdmin = currentRep.role === 'admin' || currentRep.email === 'john@pasalho.com';

  return (
    <>
      {/* Inject responsive CSS */}
      <style>{`
        .pdn-navbar {
          background: rgba(30, 27, 75, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          position: sticky;
          top: 0;
          z-index: 200;
          padding: 0.6rem 1rem;
          font-family: 'Outfit', sans-serif;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .pdn-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: #e2e8f0;
          font-size: 1.5rem;
          line-height: 1;
        }
        .pdn-nav-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pdn-desktop-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .pdn-mobile-drawer {
          display: none;
        }
        .pdn-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .pdn-hamburger {
            display: block;
          }
          .pdn-nav-links {
            display: none !important;
          }
          .pdn-desktop-right {
            display: none !important;
          }
          .pdn-mobile-drawer {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            right: -280px;
            width: 280px;
            height: 100vh;
            background: rgba(20, 18, 60, 0.98);
            backdrop-filter: blur(20px);
            z-index: 300;
            padding: 1.5rem;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -4px 0 30px rgba(0, 0, 0, 0.3);
          }
          .pdn-mobile-drawer.open {
            right: 0;
          }
          .pdn-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 250;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .pdn-overlay.open {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>

      <header className="pdn-navbar">
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/logo-full.png" alt="Pasalho DNP" style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
        </Link>

        {/* Desktop nav links */}
        <div className="pdn-nav-links">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#a78bfa' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin/orders"
              style={{
                color: pathname.startsWith('/admin') ? '#f472b6' : '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                background: pathname.startsWith('/admin') ? 'rgba(244, 114, 182, 0.15)' : 'transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              ⚙️ Admin
            </Link>
          )}
        </div>

        {/* Desktop right section */}
        <div className="pdn-desktop-right">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{currentRep.name}</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{isAdmin ? 'Administrator' : 'Sales Rep'}</span>
          </div>
          <button onClick={handleSignOut} style={{
            padding: '0.4rem 0.8rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)', transition: 'all 0.2s'
          }}>Sign Out</button>
        </div>

        {/* Mobile hamburger button */}
        <button className="pdn-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile overlay */}
      <div className={`pdn-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* Mobile slide-out drawer */}
      <div className={`pdn-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        {/* User info at top */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          paddingBottom: '1.25rem', borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, color: '#fff'
          }}>
            {currentRep.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>{currentRep.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>{isAdmin ? '⭐ Administrator' : 'Sales Rep'}</div>
          </div>
        </div>

        {/* Nav links */}
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: isActive ? '#a78bfa' : '#cbd5e1',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                transition: 'all 0.2s',
                display: 'block',
                marginBottom: '0.25rem'
              }}
            >
              {link.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin/orders"
            onClick={() => setMenuOpen(false)}
            style={{
              color: pathname.startsWith('/admin') ? '#f472b6' : '#cbd5e1',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: pathname.startsWith('/admin') ? 'rgba(244, 114, 182, 0.15)' : 'transparent',
              transition: 'all 0.2s',
              display: 'block',
              marginBottom: '0.25rem'
            }}
          >
            ⚙️ Admin Dashboard
          </Link>
        )}

        {/* Sign out at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <button onClick={handleSignOut} style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)', transition: 'all 0.2s'
          }}>
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
