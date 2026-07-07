'use client';

import { useState, useEffect } from 'react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState(''); // Cost price mapping? The backend expects costPrice/mrp/sellingPrice. Let's map this properly.
  const [unit, setUnit] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [storefrontCategory, setStorefrontCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setProducts(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const method = editingId ? 'PUT' : 'POST';
    const body = { 
      id: editingId, 
      name, 
      price: Number(price), 
      unit,
      mrp: Number(mrp) || undefined,
      sellingPrice: Number(sellingPrice) || undefined,
      stock: Number(stock) || 0,
      imageUrl: imageUrl || undefined,
      storefrontCategory: storefrontCategory || undefined,
      isActive 
    };

    await fetch('/api/admin/products', {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(body)
    });
    
    setShowForm(false);
    setEditingId(null);
    setName(''); setPrice(''); setUnit('');
    setMrp(''); setSellingPrice(''); setStock('0'); setImageUrl(''); setStorefrontCategory(''); setIsActive(true);
    fetchProducts();
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name || '');
    setPrice(p.price || p.costPrice || '');
    setUnit(p.unit || '');
    setMrp(p.mrp || '');
    setSellingPrice(p.sellingPrice || '');
    setStock(p.stock?.toString() || '0');
    setImageUrl(p.imageUrl || '');
    setStorefrontCategory(p.storefrontCategory || '');
    setIsActive(p.isActive ?? true);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Manage Products</h2>
        <button onClick={() => setShowForm(true)}>Add Product</button>
      </div>

      {showForm && (
        <div style={{ background: '#eee', padding: '1rem', marginBottom: '1rem', border: '1px solid #ccc' }}>
          <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block' }}>Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Price (NPR)</label>
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Unit (e.g. bag, carton)</label>
              <input required value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>MRP</label>
              <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Selling Price</label>
              <input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Stock</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Image URL</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Category (Q-Comm)</label>
              <input value={storefrontCategory} onChange={e => setStorefrontCategory(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block' }}>Active</label>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            </div>
            <div>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr style={{ background: '#ddd' }}>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Name</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Price</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>MRP</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Selling Price</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Stock</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Category</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Active</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.id}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.price || p.costPrice}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.mrp}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.sellingPrice}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.stock}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.storefrontCategory}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.isActive ? 'Yes' : 'No'}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  <button onClick={() => handleEdit(p)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
