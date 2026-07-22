'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) { setUserEmail(email); fetchData(email); } else { router.push('/login'); }
  }, []);

  async function fetchData(email: string) {
    try {
      const { data: userData } = await supabase.from('leads').select('shop_name').eq('email', email).single();
      if (userData) setUser(userData);

      // ✅ FIX: Sirf usi user ke orders fetch karo
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_owner_email', email)
        .order('created_at', { ascending: false });
      
      if (ordersData) setOrders(ordersData);
    } catch (error) { console.error('Error fetching data:', error); } finally { setLoading(false); }
  }

  async function updateOrderStatus(orderId: string, newStatus: string, time?: string) {
  // Order details fetch karo
  const { data: orderData } = await supabase
    .from('orders')
    .select('customer_chat_id, tracking_code, amount, shop_owner_email')
    .eq('id', orderId)
    .single();

  // Shop owner ka bot token fetch karo
  const { data: shopData } = await supabase
    .from('leads')
    .select('bot_token')
    .eq('email', orderData?.shop_owner_email)
    .single();

  const shopBotToken = shopData?.bot_token;

  const updateData: any = { status: newStatus };
  if (time) updateData.delivery_time = time;

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (!error) {
    // Invoice generate (Pro/Premium ke liye)
    if (newStatus === 'Confirmed' && orderData?.customer_chat_id) {
      try {
        await fetch('/api/generate-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId, 
            chatId: orderData.customer_chat_id,
            botToken: shopBotToken // Shop ka token bhejo
          })
        });
      } catch (err) {
        console.error('PDF generation failed:', err);
      }
    }

    // Telegram message bhejo (Shop ke bot se!)
    if (orderData?.customer_chat_id && shopBotToken) {
      let message = '';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
      const trackLink = `${appUrl}/track/${orderId}`;

      if (newStatus === 'Confirmed') {
        message = `✅ *Order Confirmed!*\n\nEstimated delivery: ${time || 'Today'}\n\nTrack live: ${trackLink}`;
      } else if (newStatus === 'Out for Delivery') {
        message = `🚴 *Your order is out for delivery!*\n\nTrack live: ${trackLink}`;
      } else if (newStatus === 'Delivered') {
        message = `✅ *Order Delivered!*\n\nThank you for shopping with us! 🙏`;
      } else if (newStatus === 'Rejected') {
        message = `❌ Maafi chahte hain, lekin aapka order reject kar diya gaya hai.`;
      }

      // Shop ke bot se message bhejo
      try {
        await fetch('/api/send-telegram-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: shopBotToken,
            chatId: orderData.customer_chat_id,
            message: message
          })
        });
      } catch (err) {
        console.error('Telegram send failed:', err);
      }
    }

    fetchData(userEmail);
    alert(`Order ${newStatus}! Customer notified.`);
  }
}

  function handleConfirmClick(orderId: string) { setSelectedOrderId(orderId); setShowDeliveryModal(true); }
  function submitDeliveryTime() { if (selectedOrderId && deliveryTime) { updateOrderStatus(selectedOrderId, 'Confirmed', deliveryTime); setShowDeliveryModal(false); setDeliveryTime(''); } }

  function toggleSelectOrder(orderId: string) { setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]); }
  function selectAll(ordersToSelect: any[]) { if (selectedOrders.length === ordersToSelect.length) setSelectedOrders([]); else setSelectedOrders(ordersToSelect.map(o => o.id)); }

  async function handleBulkDelete() {
    if (selectedOrders.length === 0) return;
    try {
      const response = await fetch('/api/orders/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderIds: selectedOrders }) });
      const result = await response.json();
      if (result.success) { alert(`${result.deleted} order(s) deleted successfully!`); setSelectedOrders([]); fetchData(userEmail); } else { alert(result.error || 'Failed to delete orders'); }
    } catch (error) { alert('Failed to delete orders'); }
    setShowDeleteConfirm(false);
  }

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (order.customer_name?.toLowerCase().includes(query) || order.items?.toLowerCase().includes(query) || order.id?.toLowerCase().includes(query) || order.address?.toLowerCase().includes(query));
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading orders...</div>;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1">← Back to Dashboard</button>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900 text-lg">{user?.shop_name || 'My Store'} - All Orders</span>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div><h2 className="text-xl font-bold text-gray-900">Order Management</h2><p className="text-sm text-gray-500 mt-1">Confirm, reject, or delete orders.</p></div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold">Pending: {orders.filter(o => o.status === 'Pending').length}</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">Completed: {orders.filter(o => o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Confirmed').length}</span>
            </div>
          </div>

          <div className="px-8 py-4 border-b border-gray-100">
            <input type="text" placeholder="🔍 Search by customer name, order ID, items, or address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
          </div>

          {selectedOrders.length > 0 && (
            <div className="px-8 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <p className="text-sm text-blue-700 font-medium">{selectedOrders.length} order(s) selected</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-semibold">🗑️ Delete Selected</button>
                <button onClick={() => setSelectedOrders([])} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">Cancel</button>
              </div>
            </div>
          )}
          
          {filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-gray-500"><div className="text-5xl mb-4"></div><p className="text-lg font-medium text-gray-900">{searchQuery ? 'No orders found matching your search.' : 'No orders found.'}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-8 py-4"><input type="checkbox" checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0} onChange={() => selectAll(filteredOrders)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-600" /></th>
                    <th className="px-8 py-4">Order ID</th><th className="px-8 py-4">Customer</th><th className="px-8 py-4">Items</th><th className="px-8 py-4">Amount</th><th className="px-8 py-4">Status</th><th className="px-8 py-4">Date</th><th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredOrders.map((order) => {
                    const canDelete = order.status === 'Delivered' || order.status === 'Rejected';
                    return (
                      <tr key={order.id} className={`hover:bg-blue-50/40 transition-colors ${!canDelete && selectedOrders.includes(order.id) ? 'bg-red-50' : ''}`}>
                        <td className="px-8 py-5"><input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelectOrder(order.id)} disabled={!canDelete} className={`rounded border-gray-300 focus:ring-blue-600 ${!canDelete ? 'opacity-30 cursor-not-allowed' : 'text-blue-600'}`} /></td>
                        <td className="px-8 py-5 font-mono font-medium text-blue-600">#{order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A'}</td>
                        <td className="px-8 py-5 font-medium text-gray-900">{order.customer_name || 'Unknown'}</td>
                        <td className="px-8 py-5 text-gray-600 max-w-md" title={order.items}>{order.items}</td>
                        <td className="px-8 py-5 font-bold text-gray-900">₹{order.amount || 0}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border border-green-200' : order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' : order.status === 'Confirmed' || order.status === 'Completed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : order.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                            {order.status === 'Delivered' ? '✓ ' : order.status === 'Rejected' ? ' ' : '⏳ '}{order.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                        <td className="px-8 py-5">
                          {order.status === 'Pending' && (<div className="flex gap-2"><button onClick={() => handleConfirmClick(order.id)} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">✅ Confirm</button><button onClick={() => updateOrderStatus(order.id, 'Rejected')} className="text-xs bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition font-semibold">❌ Reject</button></div>)}
                          {(order.status === 'Confirmed' || order.status === 'Completed') && (<button onClick={() => updateOrderStatus(order.id, 'Out for Delivery')} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm">🚴 Out for Delivery</button>)}
                          {order.status === 'Out for Delivery' && (<button onClick={() => updateOrderStatus(order.id, 'Delivered')} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">✓ Mark Delivered</button>)}
                          {(order.status === 'Delivered' || order.status === 'Rejected') && (<span className="text-xs text-gray-400 font-medium italic">Processed</span>)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Delivery Time</h3>
            <p className="text-sm text-gray-600 mb-4">When will this order be delivered?</p>
            <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g., Today by 5 PM" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={submitDeliveryTime} className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold">Confirm Order</button>
              <button onClick={() => { setShowDeliveryModal(false); setDeliveryTime(''); }} className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete {selectedOrders.length} order(s)?<br/><br/><span className="text-red-600 font-semibold">This action cannot be undone!</span></p>
            <div className="flex gap-3">
              <button onClick={handleBulkDelete} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-semibold">🗑️ Yes, Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
