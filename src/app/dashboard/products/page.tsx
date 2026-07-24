'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Add Product Form State
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('1kg');
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      setUserEmail(email);
      fetchProducts(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchProducts(email: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_owner_email', email)
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    const cleanName = newName.toLowerCase().trim();
    setSaving(true);

    // ✅ 1. CHECK FOR DUPLICATES (Case-insensitive)
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('shop_owner_email', userEmail)
      .ilike('name', cleanName)
      .single();

    if (existingProduct) {
      alert(`️ "${newName}" already exists in your list!\nPlease use a different name to add a new item.`);
      setSaving(false);
      return;
    }

    // ✅ 2. ADD NEW PRODUCT
    const { error } = await supabase
      .from('products')
      .insert([{
        shop_owner_email: userEmail,
        name: cleanName,
        unit: newUnit.trim(),
        price: parseInt(newPrice)
      }]);

    if (!error) {
      setNewName(''); setNewUnit('1kg'); setNewPrice('');
      fetchProducts(userEmail);
      alert('✅ Item successfully added!');
    } else {
      alert('Failed to add product: ' + error.message);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts(userEmail);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2">← Back to Dashboard</button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏪 Manage Price List</h1>
            <p className="text-gray-600 mt-1">Set your shop prices. Customers will see these exact prices when ordering.</p>
          </div>
        </div>

        {/* Add Product Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Item</h2>
          <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="Item Name (e.g., pyaaz, aalu)" 
              required 
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
            />
            <input 
              type="text" 
              value={newUnit} 
              onChange={(e) => setNewUnit(e.target.value)} 
              placeholder="Unit (e.g., 1kg, 500g)" 
              required 
              className="w-full md:w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
            />
            <input 
              type="number" 
              value={newPrice} 
              onChange={(e) => setNewPrice(e.target.value)} 
              placeholder="Price (₹)" 
              required 
              className="w-full md:w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
            />
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Adding...' : '+ Add Item'}
            </button>
          </form>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">Your Price Catalog ({products.length} items)</h2>
          </div>
          
          {products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No products added yet. Add your first item above!</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product) => (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{product.name}</p>
                      <p className="text-xs text-gray-500">Per {product.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
