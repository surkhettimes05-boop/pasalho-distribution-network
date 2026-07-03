'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveDraftOrder, getDraftOrders, deleteDraftOrder } from '@/lib/localSync';

export default function HomePage() {
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedRetailerId, setSelectedRetailerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [message, setMessage] = useState('Ready to capture orders');
  const [loading, setLoading] = useState(false);
  const [offlineDrafts, setOfflineDrafts] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  const loadOfflineDrafts = async () => {
    const drafts = await getDraftOrders();
    setOfflineDrafts(drafts);
  };

  useEffect(() => {
    // Check if rep is logged in
    const repData = localStorage.getItem('currentRep');
    if (!repData) {
      router.push('/login');
      return;
    }
    
    setCurrentRep(JSON.parse(repData));
    setIsOnline(navigator.onLine);

    // Fetch retailers and products from API
    const token = localStorage.getItem('accessToken');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    Promise.all([
      fetch('/api/retailers', { headers }).then(r => r.json()),
      fetch('/api/products', { headers }).then(r => r.json())
    ]).then(([retailerData, productData]) => {
      if (retailerData.retailers) setRetailers(retailerData.retailers);
      if (productData.products) setProducts(productData.products);
    }).catch((err) => {
      console.log('Error fetching catalog data (offline mode active):', err);
    });

    loadOfflineDrafts();

    const handleOnline = () => {
      setIsOnline(true);
      setMessage('✓ Back online! Synchronizing pending drafts...');
      syncDrafts();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMessage('⚠️ Device is offline. Orders will be saved as local drafts.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const syncDrafts = async () => {
    const drafts = await getDraftOrders();
    if (drafts.length === 0) return;

    setLoading(true);
    let successCount = 0;
    const token = localStorage.getItem('accessToken');

    for (const draft of drafts) {
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
      setMessage(`✓ Synced ${successCount} offline orders to server database successfully!`);
    }
  };

  const addItem = () => {
    if (!selectedProductId || !quantity) return;
    const product = products.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    const existingItem = draftItems.find(item => item.productId === Number(selectedProductId));
    if (existingItem) {
      setDraftItems(draftItems.map(item =>
        item.productId === Number(selectedProductId)
          ? { ...item, quantity: item.quantity + Number(quantity) }
          : item
      ));
    } else {
      setDraftItems([...draftItems, {
        productId: Number(selectedProductId),
        name: product.name,
        quantity: Number(quantity),
        price: product.price
      }]);
    }
    setQuantity('1');
    setMessage(`Added ${product.name}`);
  };

  const removeItem = (productId: number) => {
    setDraftItems(draftItems.filter(item => item.productId !== productId));
    setMessage('Item removed');
  };

  const saveOrder = async () => {
    if (!selectedRetailerId || draftItems.length === 0) {
      setMessage('Select retailer and add items');
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
      if (!navigator.onLine) {
        throw new Error('Offline');
      }

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

      if (!response.ok) throw new Error('Failed to save');

      const order = await response.json();
      setDraftItems([]);
      setSelectedRetailerId('');
      setMessage(`✓ Order #${order.id} saved successfully`);
    } catch (err) {
      // Save offline draft instead
      const draftId = `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await saveDraftOrder(draftId, { id: draftId, ...orderBody });
      await loadOfflineDrafts();
      setDraftItems([]);
      setSelectedRetailerId('');
      setMessage('⚠️ Device is offline. Saved order locally as a draft.');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = draftItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Offline & Sync Notification Banner */}
        {offlineDrafts.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
            border: '1px solid #f59e0b',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)',
            animation: 'pulse 2s infinite'
          }}>
            <div>
              <strong style={{ color: '#b45309', display: 'block', fontSize: '0.95rem' }}>
                Offline Drafts Pending Sync
              </strong>
              <span style={{ color: '#d97706', fontSize: '0.85rem' }}>
                You have {offlineDrafts.length} order(s) cached locally.
              </span>
            </div>
            <button
              onClick={syncDrafts}
              disabled={loading || !isOnline}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isOnline ? '#d97706' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isOnline ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Syncing...' : isOnline ? 'Sync Now' : 'Device Offline'}
            </button>
          </div>
        )}

        {/* Status Message */}
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '10px',
          background: message.includes('✓') ? '#dcfce7' : message.includes('⚠️') ? '#fee2e2' : '#e0f2fe',
          color: message.includes('✓') ? '#166534' : message.includes('⚠️') ? '#991b1b' : '#0369a1',
          fontSize: '0.9rem',
          fontWeight: 600,
          border: `1px solid ${message.includes('✓') ? '#bbf7d0' : message.includes('⚠️') ? '#fecaca' : '#bae6fd'}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {message}
        </div>

        {/* Order capture card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
            Capture Field Order
          </h2>

          {/* Step 1: Select Retailer */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
              1. Select Retailer
            </label>
            <select
              value={selectedRetailerId}
              onChange={(e) => setSelectedRetailerId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: 'white',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Choose shop --</option>
              {retailers.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.location}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Add Products */}
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
              2. Add Catalog Items
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    background: 'white',
                    color: '#334155',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (KES {p.price})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    color: '#334155',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>

              <button
                onClick={addItem}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                }}
              >
                + Add To Order
              </button>
            </div>
          </div>

          {/* Draft Items List */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#1e293b', fontWeight: 700 }}>
              Order Basket
            </h3>
            
            {draftItems.length === 0 ? (
              <div style={{
                padding: '1.5rem',
                border: '2px dashed #e2e8f0',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.85rem'
              }}>
                No items added yet. Choose items above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {draftItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.9rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#334155' }}>
                        {item.name} <span style={{ color: '#64748b', fontWeight: 500 }}>× {item.quantity}</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        Subtotal: KES {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  color: '#0f172a',
                  fontSize: '1rem'
                }}>
                  <span>Total Order Value:</span>
                  <span>KES {totalValue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <button
              onClick={() => {
                setDraftItems([]);
                setSelectedRetailerId('');
                setMessage('Basket cleared');
              }}
              style={{
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Clear Basket
            </button>
            
            <button
              onClick={saveOrder}
              disabled={loading}
              style={{
                padding: '0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              {loading ? 'Saving...' : '✓ Submit Order'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#94a3b8',
          lineHeight: 1.5
        }}>
          Orders save directly to the warehouse.
          <br />
          Sync status checks and processes are executed securely.
        </div>
      </div>
    </main>
  );
}
