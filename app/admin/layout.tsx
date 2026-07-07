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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* Mobile Hamburger Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-40 p-2 bg-slate-800 text-white rounded"
        aria-label="Toggle Sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 w-[250px] shrink-0 bg-slate-800 text-white p-4 flex flex-col transition-transform duration-200 ease-in-out`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Pasalho Admin</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`px-4 py-3 rounded no-underline ${isActive ? 'text-white bg-slate-700 font-bold' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-8">
          <Link href="/" className="text-slate-300 no-underline text-sm hover:text-white">
            ← Back to App
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
        <div className="md:hidden h-12 mb-4"></div>
        {children}
      </div>
    </div>
  );
}
