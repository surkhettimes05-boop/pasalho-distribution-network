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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#1e293b', color: 'white', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Pasalho Admin</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
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
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
