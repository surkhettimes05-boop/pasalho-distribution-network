'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAdminRep } from '@/lib/admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const repData = localStorage.getItem('currentRep');
    if (!repData) {
      router.push('/login');
      return;
    }
    try {
      const rep = JSON.parse(repData);
      if (isAdminRep(rep)) {
        setIsAuthorized(true);
      } else {
        router.push('/');
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted || !isAuthorized) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  const navItems = [
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Retailers', href: '/admin/retailers' },
    { label: 'DB Backup', href: '/admin/backup' },
  ];

  return (
    <>
      <style>{`
        .admin-layout-container {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          color: #0f172a;
          font-family: sans-serif;
          position: relative;
        }
        .admin-hamburger {
          display: none;
        }
        .admin-overlay {
          display: none;
        }
        .admin-sidebar {
          width: 250px;
          flex-shrink: 0;
          background-color: #1e293b;
          color: white;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          z-index: 50;
        }
        .admin-main-content {
          flex: 1;
          min-width: 0;
          padding: 2rem;
          overflow-y: auto;
        }
        .admin-mobile-spacer {
          display: none;
        }
        
        @media (max-width: 768px) {
          .admin-hamburger {
            display: block;
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 40;
            padding: 0.5rem;
            background-color: #1e293b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .admin-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 40;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
          }
          .admin-overlay.open {
            opacity: 1;
            pointer-events: auto;
          }
          .admin-sidebar {
            position: fixed;
            inset-y: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.2s ease-in-out;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main-content {
            padding: 1rem;
          }
          .admin-mobile-spacer {
            display: block;
            height: 3rem;
            margin-bottom: 1rem;
          }
        }
      `}</style>
      <div className="admin-layout-container">
        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="admin-hamburger"
          aria-label="Toggle Sidebar"
        >
          <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Overlay */}
        <div 
          className={`admin-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Pasalho Admin</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{ display: 'none', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              className="md-hidden-btn"
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <style>{`
              @media (max-width: 768px) {
                .md-hidden-btn { display: block !important; }
              }
            `}</style>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: isActive ? 'white' : '#94a3b8',
                    background: isActive ? '#334155' : 'transparent',
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem' }}>
              ← Back to App
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main-content">
          <div className="admin-mobile-spacer"></div>
          {children}
        </div>
      </div>
    </>
  );
}
