'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveDraftOrder, getDraftOrders, deleteDraftOrder } from '@/lib/localSync';

// --- Local Storage Hooks for Persistence ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue !== null) {
      try { setValue(JSON.parse(stickyValue)); } catch (e) {}
    }
    setIsMounted(true);
  }, [key]);

  useEffect(() => {
    if (isMounted) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value, isMounted]);

  return [value, setValue];
}

export default function HomePage() {
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Persisted Order State (Survives app close via localStorage)
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
  const [showRetailerPicker, setShowRetailerPicker] = useState(false);
  const [retailerSearch, setRetailerSearch] = useState('');

  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    if (!selectedRetailerId || draftItems.length === 0) {
        setMessage('Missing retailer or items.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }

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

      // Success! Show brief checkmark animation.
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowReview(false);
        setDraftItems([]);
        setSelectedRetailerId('');
      }, 900);

    } catch (err: any) {
      // Distinguish between true network failures and server errors (e.g. 500)
      const isNetworkError = err.message === 'Offline' || err.name === 'TypeError';
      
      if (isNetworkError) {
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
        }, 900);
      } else {
        // It's a server error (4xx/5xx)
        setMessage(err.message || 'An unexpected error occurred.');
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
  
  const filteredRetailers = useMemo(() => {
    return retailers.filter(r => r.name.toLowerCase().includes(retailerSearch.toLowerCase()) || r.location.toLowerCase().includes(retailerSearch.toLowerCase()));
  }, [retailers, retailerSearch]);

  const selectedRetailer = retailers.find(r => r.id.toString() === selectedRetailerId);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: draftItems.length > 0 ? '120px' : '20px' }}>
      
      {/* Offline Sync Banner */}
      {offlineDrafts.length > 0 && (
        <div onClick={syncDrafts} style={{
          background: 'var(--color-brand)', color: 'white', padding: '0.85rem 1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 600, fontSize: '0.95rem', cursor: isOnline ? 'pointer' : 'default',
          boxShadow: '0 2px 4px rgba(234,88,12,0.2)'
        }}>
          <span>⚠️ {offlineDrafts.length} unsynced order(s)</span>
          <span style={{ opacity: 0.9 }}>{loading ? 'Syncing...' : isOnline ? 'Tap to Sync' : 'Offline'}</span>
        </div>
      )}

      {/* Global Error Message Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: '1rem', left: '1rem', right: '1rem', zIndex: 9999,
          background: '#FEE2E2', color: '#991B1B', padding: '1rem', borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600, fontSize: '0.95rem',
          border: '1px solid #F87171'
        }}>
          {message}
        </div>
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
        
        {/* Retailer Selector Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Delivering To
          </label>
          <button
            onClick={() => setShowRetailerPicker(true)}
            style={{
              width: '100%', padding: '1.25rem 1rem', borderRadius: '16px',
              background: 'var(--color-surface)', border: selectedRetailer ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.2s ease'
            }}
          >
            {selectedRetailer ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-ink)' }}>{selectedRetailer.name}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginTop: '0.25rem' }}>{selectedRetailer.location}</div>
              </div>
            ) : (
              <span style={{ fontSize: '1.1rem', color: 'var(--color-ink-muted)' }}>Tap to choose retailer...</span>
            )}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink-muted)' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Pinned Search Bar for Products */}
        <div style={{
          position: 'sticky', top: '1rem', zIndex: 10,
          background: 'rgba(250, 250, 249, 0.95)', backdropFilter: 'blur(10px)',
          paddingBottom: '1rem', margin: '0 -1rem', padding: '0 1rem 1rem 1rem'
        }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '100px',
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                fontSize: '1rem', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
          </div>
        </div>

        {/* Product Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredProducts.map(product => {
            const draftItem = draftItems.find(i => i.productId === product.id);
            const qty = draftItem ? draftItem.quantity : 0;
            const isSelected = qty > 0;

            return (
              <div key={product.id} style={{
                background: 'var(--color-surface)', padding: '1rem', borderRadius: '16px',
                border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: isSelected ? '0 4px 12px rgba(234,88,12,0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-ink)', lineHeight: 1.3 }}>{product.name}</div>
                  <div style={{ color: 'var(--color-brand)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.35rem' }}>
                    NPR {product.price.toLocaleString()} <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400, fontSize: '0.85rem' }}>/ {product.unit}</span>
                  </div>
                </div>
                
                {/* Stepper Control - Large Tap Targets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: isSelected ? '#FFF7ED' : '#F1F5F9', borderRadius: '100px', border: isSelected ? '1px solid #FFEDD5' : '1px solid transparent' }}>
                  <button 
                    onClick={() => handleQuantityChange(product, -1)}
                    disabled={qty === 0}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      border: 'none', background: 'transparent',
                      color: qty > 0 ? 'var(--color-brand)' : '#94A3B8',
                      fontSize: '1.5rem', fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: qty > 0 ? 'pointer' : 'default',
                      opacity: qty > 0 ? 1 : 0.5
                    }}
                  >−</button>
                  <span style={{ 
                    minWidth: '32px', textAlign: 'center', fontWeight: 700, 
                    fontSize: '1.1rem', color: qty > 0 ? 'var(--color-brand)' : 'var(--color-ink)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {qty}
                  </span>
                  <button 
                    onClick={() => handleQuantityChange(product, 1)}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      border: 'none', background: 'transparent',
                      color: isSelected ? 'var(--color-brand)' : 'var(--color-ink)', 
                      fontSize: '1.5rem', fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >+</button>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-muted)' }}>
              No products found matching "{searchQuery}"
            </div>
          )}
        </div>

      </div>

      {/* Sticky Bottom Basket Bar */}
      {draftItems.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          padding: '1rem', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -10px 25px rgba(0,0,0,0.05)', zIndex: 100
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Basket ({totalItems} items)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                NPR {totalValue.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => {
                if (!selectedRetailerId) {
                  setShowRetailerPicker(true);
                  return;
                }
                setShowReview(true);
              }}
              style={{
                background: 'var(--color-brand)', color: 'white',
                border: 'none', padding: '1.15rem 1.75rem', borderRadius: '100px',
                fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(234,88,12,0.3)',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              Review Order
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Retailer Search Sheet / Modal */}
      {showRetailerPicker && (
        <>
          <div onClick={() => setShowRetailerPicker(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 200,
            animation: 'fadeIn 0.2s ease'
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--color-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '1.5rem 1rem calc(1.5rem + env(safe-area-inset-bottom))',
            zIndex: 210, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Choose Retailer</h2>
                <button onClick={() => setShowRetailerPicker(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search shops or locations..."
                value={retailerSearch}
                onChange={(e) => setRetailerSearch(e.target.value)}
                style={{
                  width: '100%', padding: '1rem', borderRadius: '12px',
                  border: '1px solid var(--color-border)', background: 'var(--color-background)',
                  fontSize: '1rem', outline: 'none', marginBottom: '1rem'
                }}
              />

              <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '1rem' }}>
                {filteredRetailers.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRetailerId(r.id.toString());
                      setShowRetailerPicker(false);
                      setRetailerSearch('');
                    }}
                    style={{
                      width: '100%', padding: '1rem', textAlign: 'left',
                      background: r.id.toString() === selectedRetailerId ? '#FFF7ED' : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--color-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: r.id.toString() === selectedRetailerId ? 'var(--color-brand)' : 'var(--color-ink)' }}>{r.name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>{r.location}</div>
                    </div>
                    {r.id.toString() === selectedRetailerId && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </button>
                ))}
                {filteredRetailers.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>No retailers found.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Full-Screen Review & Submit Bottom Sheet */}
      {showReview && (
        <>
          <div onClick={() => !loading && !showSuccess && setShowReview(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 200,
            animation: 'fadeIn 0.2s ease'
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--color-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '2rem 1.5rem calc(2rem + env(safe-area-inset-bottom))',
            zIndex: 210, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              
              {!showSuccess ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Review Order</h2>
                    <button onClick={() => setShowReview(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Delivering to</div>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{selectedRetailer?.name}</div>
                    <div style={{ color: 'var(--color-ink-muted)', marginTop: '0.15rem' }}>{selectedRetailer?.location}</div>
                  </div>

                  <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Order Items</div>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden' }}>
                      {draftItems.map((item, index) => (
                        <div key={item.productId} style={{ 
                          display: 'flex', justifyContent: 'space-between', padding: '1rem', 
                          borderBottom: index === draftItems.length - 1 ? 'none' : '1px solid var(--color-border)',
                          background: 'var(--color-surface)'
                        }}>
                          <div style={{ flex: 1, paddingRight: '1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.3 }}>{item.name}</div>
                            <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{item.quantity} units @ NPR {item.price.toLocaleString()}</div>
                          </div>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                            NPR {(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', marginTop: '1rem', borderTop: '2px dashed var(--color-border)', fontSize: '1.25rem', fontWeight: 800 }}>
                      <span>Total Amount</span>
                      <span style={{ color: 'var(--color-brand)' }}>NPR {totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={saveOrder}
                    disabled={loading}
                    style={{
                      width: '100%', background: 'var(--color-brand)', color: 'white',
                      border: 'none', padding: '1.25rem', borderRadius: '100px',
                      fontSize: '1.15rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                      boxShadow: '0 8px 25px rgba(234,88,12,0.35)',
                      transition: 'transform 0.1s ease', transform: loading ? 'scale(0.98)' : 'scale(1)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    {loading ? (
                       <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    ) : 'Confirm & Submit Order'}
                  </button>
                </>
              ) : (
                /* Sub-1s Success Animation State */
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    background: 'var(--color-success)', margin: '0 auto 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 10px 25px rgba(22, 163, 74, 0.4)'
                  }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'checkmarkDraw 0.4s 0.1s ease forwards' }}></polyline>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.5rem' }}>Order Submitted</h2>
                  <p style={{ color: 'var(--color-ink-muted)', fontSize: '1.1rem' }}>Returning to catalog...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmarkDraw {
          to { stroke-dashoffset: 0; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
