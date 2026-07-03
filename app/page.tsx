'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveDraftOrder, getDraftOrders, deleteDraftOrder } from '@/lib/localSync';

// --- Local Storage Hooks for Persistence ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default function HomePage() {
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Persisted Order State
  const [selectedRetailerId, setSelectedRetailerId] = useStickyState<string>('', 'pdn_draft_retailer');
  const [draftItems, setDraftItems] = useStickyState<any[]>([], 'pdn_draft_items');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [offlineDrafts, setOfflineDrafts] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  
  // UI States
  const [showReview, setShowReview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const router = useRouter();

  const loadOfflineDrafts = async () => {
    const drafts = await getDraftOrders();
    setOfflineDrafts(drafts);
  };

  useEffect(() => {
    const repData = localStorage.getItem('currentRep');
    if (!repData) {
      router.push('/login');
      return;
    }
    try { setCurrentRep(JSON.parse(repData)); } catch(e) {}

    const fetchData = async () => {
      try {
        const [retRes, prodRes] = await Promise.all([
          fetch('/api/retailers'),
          fetch('/api/products')
        ]);
        if (retRes.ok) setRetailers(await retRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
      } catch (err) {
        console.error('Failed to load catalog');
      }
    };
    fetchData();

    loadOfflineDrafts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const syncDrafts = async () => {
    if (!isOnline || offlineDrafts.length === 0) return;
    setLoading(true);
    setMessage('');
    
    let successCount = 0;
    const token = localStorage.getItem('accessToken');

    for (const draft of offlineDrafts) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            distributorId: draft.distributorId,
            retailerId: draft.retailerId,
            repId: draft.repId,
            status: 'pending',
            paymentStatus: 'credit',
            items: draft.items.map((it: any) => ({
              productId: it.productId,
              quantity: it.quantity
            }))
          })
        });

        if (response.ok) {
          await deleteDraftOrder(draft.id);
          successCount++;
        }
      } catch (err) {
        console.error('Failed to sync offline draft:', draft.id, err);
      }
    }

    await loadOfflineDrafts();
    setLoading(false);
    if (successCount > 0) {
      setMessage(`Synced ${successCount} offline orders successfully!`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleQuantityChange = (product: any, delta: number) => {
    setDraftItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (!existing) {
        if (delta > 0) {
          return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: delta }];
        }
        return prev;
      }
      
      const newQuantity = existing.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter(item => item.productId !== product.id);
      }
      
      return prev.map(item => 
        item.productId === product.id ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const saveOrder = async () => {
    if (!selectedRetailerId || draftItems.length === 0) return;

    const token = localStorage.getItem('accessToken');
    const orderBody = {
      distributorId: currentRep?.distributorId || 'pasalho-001',
      retailerId: Number(selectedRetailerId),
      repId: currentRep?.id,
      status: 'pending',
      paymentStatus: 'credit',
      items: draftItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.name
      }))
    };

    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error('Offline');

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...orderBody,
          items: orderBody.items.map(it => ({ productId: it.productId, quantity: it.quantity }))
        })
      });

      if (!response.ok) {
        let errData;
        try { errData = await response.json(); } catch (e) {}
        throw new Error(errData?.error || `Server error: ${response.status}`);
      }

      // Success! Show animation.
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowReview(false);
        setDraftItems([]);
        setSelectedRetailerId('');
      }, 800); // Short, satisfying animation

    } catch (err: any) {
      if (err.message === 'Offline' || err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('network')) {
        const draftId = `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await saveDraftOrder(draftId, { id: draftId, ...orderBody });
        await loadOfflineDrafts();
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setShowReview(false);
          setDraftItems([]);
          setSelectedRetailerId('');
          setMessage('Device is offline. Saved locally.');
          setTimeout(() => setMessage(''), 4000);
        }, 1200);
      } else {
        setMessage(`Error: ${err.message}`);
        setTimeout(() => setMessage(''), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const totalValue = draftItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = draftItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const selectedRetailer = retailers.find(r => r.id.toString() === selectedRetailerId);

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' /* space for sticky bar */ }}>
      {/* Offline Sync Banner */}
      {offlineDrafts.length > 0 && (
        <div onClick={syncDrafts} style={{
          background: 'var(--color-brand)', color: 'white', padding: '0.75rem 1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 600, fontSize: '0.9rem', cursor: isOnline ? 'pointer' : 'default'
        }}>
          <span>⚠️ {offlineDrafts.length} unsynced order(s)</span>
          <span style={{ opacity: 0.9 }}>{loading ? 'Syncing...' : isOnline ? 'Tap to Sync' : 'Offline'}</span>
        </div>
      )}

      {/* Error Message Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: '1rem', left: '1rem', right: '1rem', zIndex: 9999,
          background: '#FEE2E2', color: '#991B1B', padding: '1rem', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600, fontSize: '0.95rem'
        }}>
          {message}
        </div>
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Step 1: Retailer Selection */}
        <div style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginBottom: '0.75rem' }}>
            Choose Shop
          </h2>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedRetailerId}
              onChange={(e) => setSelectedRetailerId(e.target.value)}
              style={{
                width: '100%', padding: '1rem', paddingRight: '2.5rem',
                appearance: 'none', borderRadius: '12px',
                border: selectedRetailerId ? '2px solid var(--color-brand)' : '2px solid var(--color-border)',
                background: 'var(--color-surface)', fontSize: '1rem',
                fontWeight: selectedRetailerId ? 600 : 400,
                color: 'var(--color-ink)', outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <option value="">Tap to select...</option>
              {retailers.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.location}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              ▼
            </div>
          </div>
        </div>

        {/* Step 2: Catalog & Search */}
        <div style={{ padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem', marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', margin: 0 }}>Catalog</h2>
          </div>
          
          <input
            type="search"
            placeholder="🔍 Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              fontSize: '1rem', marginBottom: '1rem', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredProducts.map(product => {
              const draftItem = draftItems.find(i => i.productId === product.id);
              const qty = draftItem ? draftItem.quantity : 0;
              const isSelected = qty > 0;

              return (
                <div key={product.id} style={{
                  background: 'var(--color-surface)', padding: '1rem', borderRadius: '12px',
                  border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-ink)' }}>{product.name}</div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      NPR {product.price.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Stepper Control */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', borderRadius: '30px', padding: '0.25rem' }}>
                    <button 
                      onClick={() => handleQuantityChange(product, -1)}
                      disabled={qty === 0}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: 'none', background: qty > 0 ? 'white' : 'transparent',
                        color: qty > 0 ? 'var(--color-brand)' : '#94A3B8',
                        fontSize: '1.25rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: qty > 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        cursor: qty > 0 ? 'pointer' : 'default'
                      }}
                    >−</button>
                    <span style={{ 
                      minWidth: '20px', textAlign: 'center', fontWeight: 700, 
                      fontSize: '1.1rem', color: qty > 0 ? 'var(--color-ink)' : '#94A3B8'
                    }}>
                      {qty}
                    </span>
                    <button 
                      onClick={() => handleQuantityChange(product, 1)}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: 'none', background: 'var(--color-brand)',
                        color: 'white', fontSize: '1.25rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(234,88,12,0.3)', cursor: 'pointer'
                      }}
                    >+</button>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-ink-muted)' }}>
                No products found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Bottom Basket Bar */}
      {draftItems.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--color-border)',
          padding: '1rem', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 100
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>{totalItems} items</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                NPR {totalValue.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => {
                if (!selectedRetailerId) {
                  setMessage('⚠️ Please choose a shop first.');
                  setTimeout(() => setMessage(''), 3000);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                setShowReview(true);
              }}
              style={{
                background: 'var(--color-ink)', color: 'white',
                border: 'none', padding: '1rem 1.5rem', borderRadius: '12px',
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(30,41,59,0.3)'
              }}
            >
              Review Order ➔
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Review & Submit Bottom Sheet */}
      {showReview && (
        <>
          <div onClick={() => !loading && !showSuccess && setShowReview(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 200
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--color-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '2rem 1.5rem calc(2rem + env(safe-area-inset-bottom))',
            zIndex: 210, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              
              {!showSuccess ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Order Summary</h2>
                    <button onClick={() => setShowReview(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-ink-muted)', padding: '0.5rem' }}>✕</button>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.25rem' }}>Delivering to</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedRetailer?.name}</div>
                    <div style={{ color: 'var(--color-ink-muted)' }}>{selectedRetailer?.location}</div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    {draftItems.map(item => (
                      <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{item.quantity}×</span> {item.name}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          NPR {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--color-brand)' }}>NPR {totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={saveOrder}
                    disabled={loading}
                    style={{
                      width: '100%', background: 'var(--color-brand)', color: 'white',
                      border: 'none', padding: '1.25rem', borderRadius: '16px',
                      fontSize: '1.1rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                      boxShadow: '0 8px 20px rgba(234,88,12,0.3)',
                      transition: 'transform 0.1s', transform: loading ? 'scale(0.98)' : 'scale(1)'
                    }}
                  >
                    {loading ? 'Saving Order...' : 'Confirm & Save'}
                  </button>
                </>
              ) : (
                /* Success Animation State */
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--color-success)', margin: '0 auto 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'checkmarkDraw 0.4s 0.2s ease forwards' }}></polyline>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>Order Saved!</h2>
                  <p style={{ color: 'var(--color-ink-muted)' }}>Ready for the next shop.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
