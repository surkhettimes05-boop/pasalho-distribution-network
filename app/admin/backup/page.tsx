'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminBackupPage() {
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [backupConfig, setBackupConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const router = useRouter();

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('currentRep');
        localStorage.removeItem('accessToken');
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setBackupConfig(data);
      } else {
        showStatusMessage(data.error || 'Failed to fetch backup configuration.', 'error');
      }
    } catch (err: any) {
      showStatusMessage('Network error connection failed.', 'error');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    const repData = localStorage.getItem('currentRep');
    if (!repData) {
      router.push('/login');
      return;
    }
    setCurrentRep(JSON.parse(repData));
    fetchStatus();
  }, [router]);

  const showStatusMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 6000);
  };

  const handleBackupNow = async () => {
    setIsLoading(true);
    showStatusMessage('Initializing PostgreSQL dump and sync process...', 'info');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showStatusMessage(`✓ Backup "${data.filename}" created and synced to Google Drive successfully!`, 'success');
        fetchStatus();
      } else {
        showStatusMessage(data.error || 'Backup creation failed.', 'error');
      }
    } catch (err: any) {
      showStatusMessage('Backup process encountered a network error.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isPageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', width: 40, height: 40, borderRadius: '50%', borderLeftColor: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <div>Loading Admin Backup Center...</div>
          <style jsx global>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, #0f172a 0%, #1e293b 100%)', padding: '30px 15px', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Navigation / Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 }}>
          <div>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
              ← Return to Order Capture
            </Link>
            <h1 style={{ margin: '8px 0 0 0', fontSize: 32, fontWeight: 800, background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Google Drive Backup Center
            </h1>
          </div>
          {currentRep && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{currentRep.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Admin Administrator</div>
            </div>
          )}
        </div>

        {/* Global Toast Alert */}
        {message && (
          <div style={{
            padding: '16px 20px',
            marginBottom: 25,
            borderRadius: 12,
            background: messageType === 'success' ? 'rgba(16,185,129,0.15)' : messageType === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
            border: `1px solid ${messageType === 'success' ? 'rgba(16,185,129,0.3)' : messageType === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
            color: messageType === 'success' ? '#34d399' : messageType === 'error' ? '#f87171' : '#60a5fa',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ fontSize: 16 }}>
              {messageType === 'success' ? '✓' : messageType === 'error' ? '⚠' : 'ℹ'}
            </div>
            <div>{message}</div>
          </div>
        )}

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 25 }}>
          
          {/* Card 1: Connection & Status */}
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              Backup Storage Settings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Google Drive Sync Path</span>
                <code style={{ background: 'rgba(0,0,0,0.2)', padding: '3px 8px', borderRadius: 6, fontSize: 13, color: '#38bdf8' }}>
                  {backupConfig?.configuredPath || 'Not configured'}
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Sync Status</span>
                <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: backupConfig?.pathExists ? '#10b981' : '#f59e0b' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: backupConfig?.pathExists ? '#10b981' : '#f59e0b', display: 'inline-block', boxShadow: backupConfig?.pathExists ? '0 0 8px #10b981' : 'none' }} />
                  {backupConfig?.pathExists ? 'Online & Linked' : 'Directory Not Found (Will Create Automatically)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Automated Backup Daemon</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                  Active (Every {process.env.BACKUP_INTERVAL_MINUTES || 60}m)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Execute Action */}
          <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 30, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>
              Manual Sync Trigger
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
              Force an immediate database backup dump. The file is created locally and Google Drive Desktop will immediately sync the backup file to your Google cloud storage.
            </p>
            <button
              onClick={handleBackupNow}
              disabled={isLoading}
              style={{
                background: isLoading ? '#475569' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderLeftColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Processing Dump...
                </>
              ) : (
                'Sync & Backup Now'
              )}
            </button>
          </div>

          {/* Card 3: Backups History */}
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 18px 0', color: '#f1f5f9' }}>
              Existing Backups in Google Drive
            </h2>
            
            {!backupConfig?.backups || backupConfig.backups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.1)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🗃</div>
                <div style={{ color: '#94a3b8', fontSize: 14 }}>No backup files found in directory.</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Trigger a manual backup above to create your first save.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 10px', color: '#94a3b8', fontWeight: 600 }}>Filename</th>
                      <th style={{ padding: '12px 10px', color: '#94a3b8', fontWeight: 600 }}>Size</th>
                      <th style={{ padding: '12px 10px', color: '#94a3b8', fontWeight: 600 }}>Date Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupConfig.backups.map((b: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'default' }}>
                        <td style={{ padding: '14px 10px', fontWeight: 500, color: '#f1f5f9' }}>
                          <span style={{ marginRight: 6 }}>📄</span>
                          {b.filename}
                        </td>
                        <td style={{ padding: '14px 10px', color: '#cbd5e1' }}>{formatBytes(b.sizeBytes)}</td>
                        <td style={{ padding: '14px 10px', color: '#94a3b8' }}>
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
          Pasalho Distribution Network — Database Sync Utility. Keep database secure.
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
