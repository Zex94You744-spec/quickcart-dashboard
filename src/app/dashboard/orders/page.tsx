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
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) fetchData(email);
    else router.push('/login');
  }, []);

  async function fetchData(email: string) {
    try {
      const { data: userData } = await supabase.from('leads').select('shop_name').eq('email', email).single();
      if (userData) setUser(userData);

      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string, time?: string) {
    const { data: orderData } = await supabase.from('orders').select('customer_chat_id, tracking_code').eq('id', orderId).single();
    
    const updateData: any = { status: newStatus };
    if (time) updateData.delivery_time = time;

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    
    if (!error) {
      if (orderData?.customer_chat_id) {
        let message = '';
        if (newStatus === 'Confirmed') {          message = `✅ *Order Confirmed!*\n\nEstimated delivery: ${time || 'Today'}\n\nTrack live: https://quickcart-dashboard-ten.vercel.app/track/${orderId}`;
        } else if (newStatus === 'Out for Delivery') {
          message = `🚴 *Your order is out for delivery!*\n\nTrack live: https://quickcart-dashboard-ten.vercel.app/track/${orderId}`;
        } else if (newStatus === 'Delivered') {
          message = `✅ *Order Delivered!*\n\nThank you for shopping with us! 🙏`;
        } else if (newStatus === 'Rejected') {
          message = `❌ Maafi chahte hain, lekin aapka order reject kar diya gaya hai.`;
        }

        try {
          await fetch('/api/send-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: orderData.customer_chat_id, message })
          });
        } catch (err) {
          console.error('Telegram send failed:', err);
        }
      }

      fetchData(localStorage.getItem('userEmail') || '');
      alert(`Order ${newStatus}! Customer notified.`);
    }
  }

  function handleConfirmClick(orderId: string) {
    setSelectedOrderId(orderId);
    setShowDeliveryModal(true);
  }

  function submitDeliveryTime() {
    if (selectedOrderId && deliveryTime) {
      updateOrderStatus(selectedOrderId, 'Confirmed', deliveryTime);
      setShowDeliveryModal(false);
      setDeliveryTime('');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading orders...</div>;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1">
          ← Back to Dashboard
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900 text-lg">{user?.shop_name || 'My Store'} - All Orders</span>      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
              <p className="text-sm text-gray-500 mt-1">Confirm or reject incoming orders from Telegram.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold">
                Pending: {orders.filter(o => o.status === 'Pending').length}
              </span>
            </div>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium text-gray-900">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Order ID</th>
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-8 py-4">Items</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-8 py-5 font-mono font-medium text-blue-600">#{order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A'}</td>
                      <td className="px-8 py-5 font-medium text-gray-900">{order.customer_name || 'Unknown'}</td>
                      <td className="px-8 py-5 text-gray-600 max-w-md" title={order.items}>{order.items}</td>
                      <td className="px-8 py-5 font-bold text-gray-900">₹{order.amount || 0}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'Delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                          order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          order.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 
                          'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>                          {order.status === 'Delivered' ? '✓ ' : order.status === 'Rejected' ? '✗ ' : '⏳ '}{order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-8 py-5">
                        {order.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleConfirmClick(order.id)} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">
                              ✅ Confirm
                            </button>
                            <button onClick={() => updateOrderStatus(order.id, 'Rejected')} className="text-xs bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition font-semibold">
                              ❌ Reject
                            </button>
                          </div>
                        )}
                        {order.status === 'Confirmed' && (
                          <button onClick={() => updateOrderStatus(order.id, 'Out for Delivery')} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm">
                            🚴 Out for Delivery
                          </button>
                        )}
                        {order.status === 'Out for Delivery' && (
                          <button onClick={() => updateOrderStatus(order.id, 'Delivered')} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">
                            ✓ Mark Delivered
                          </button>
                        )}
                        {(order.status === 'Delivered' || order.status === 'Rejected') && (
                          <span className="text-xs text-gray-400 font-medium italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Time Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Delivery Time</h3>
            <p className="text-sm text-gray-600 mb-4">When will this order be delivered?</p>
            <input 
              type="text" 
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="e.g., Today by 5 PM"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none mb-4"            />
            <div className="flex gap-3">
              <button onClick={submitDeliveryTime} className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold">
                Confirm Order
              </button>
              <button onClick={() => setShowDeliveryModal(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
