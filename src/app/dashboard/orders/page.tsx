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
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    if (email) {
      if (role === 'admin' || email === 'devbusines01@gmail.com' || email === 'support@quickcart.com') {
        window.location.replace('/admin/dashboard');
        return;
      }
      setUserEmail(email);
      fetchData(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchData(email: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_owner_email', email)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  // Standard Status Update Function
  async function handleUpdateStatus(orderId: string, newStatus: string) {
    const { data: orderData } = await supabase.from('orders').select('customer_chat_id, shop_owner_email').eq('id', orderId).single();
    const { data: shopData } = await supabase.from('leads').select('bot_token').eq('email', orderData?.shop_owner_email).single();
    const shopBotToken = shopData?.bot_token;

    const updateData: any = { status: newStatus };
    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);

    if (!error) {
      // PDF Generation for Pro/Premium on 'Confirmed'
      if (newStatus === 'Confirmed' && orderData?.customer_chat_id) {
        try {
          await fetch('/api/generate-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, chatId: orderData.customer_chat_id, botToken: shopBotToken })
          });
        } catch (err) { console.error('PDF gen failed:', err); }
      }

      // Telegram Notification
      if (orderData?.customer_chat_id && shopBotToken) {
        let message = '';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
        const trackLink = `${appUrl}/track/${orderId}`;

        if (newStatus === 'Confirmed') message = `✅ *Order Confirmed!*\n\nShop will process your order shortly.\n\nTrack live: ${trackLink}`;
        else if (newStatus === 'Out for Delivery') message = `🚴 *Your order is out for delivery!*\n\nTrack live: ${trackLink}`;
        else if (newStatus === 'Delivered') message = `✅ *Order Delivered!*\n\nThank you for shopping with us! `;
        else if (newStatus === 'Rejected') message = `❌ Maafi chahte hain, lekin aapka order reject kar diya gaya hai.`;

        if (message) {
          try {
            await fetch('/api/send-telegram-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ botToken: shopBotToken, chatId: orderData.customer_chat_id, message })
            });
          } catch (err) { console.error('Telegram send failed:', err); }
        }
      }
      fetchData(userEmail);
      alert(`Order status updated to ${newStatus}!`);
    }
  }

  // ✅ NEW: Price Confirmation Function
  async function confirmPrice(orderId: string, finalAmount: number) {
    const { error } = await supabase
      .from('orders')
      .update({ amount: finalAmount, status: 'Pending', price_confirmed: true })
      .eq('id', orderId);

    if (!error) {
      const { data: orderData } = await supabase.from('orders').select('customer_chat_id, shop_owner_email').eq('id', orderId).single();
      const { data: shopData } = await supabase.from('leads').select('bot_token').eq('email', orderData?.shop_owner_email).single();

      if (orderData?.customer_chat_id && shopData?.bot_token) {
        const message = `📋 *Price Confirmation Required*\n\nYour order total has been updated by the shop.\n\n*Final Amount:* ₹${finalAmount}\n\nPlease reply *YES* to confirm or *NO* to cancel.`;
        
        try {
          await fetch('/api/send-telegram-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botToken: shopData.bot_token, chatId: orderData.customer_chat_id, message })
          });
        } catch (err) { console.error('Telegram send failed:', err); }
      }
      fetchData(userEmail);
      alert(`Price confirmed! Customer notified with final amount ₹${finalAmount}`);
    } else {
      alert('Failed to confirm price');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center gap-2">← Back to Dashboard</button>
            <h1 className="text-3xl font-bold text-gray-900">Manage Orders 📦</h1>
            <p className="text-gray-600 mt-1">View, confirm prices, and update order statuses.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No orders received yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {orders.map((order) => {
                    const isPricePending = order.status === 'Pending Price Confirmation';
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">#{String(order.id).slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{order.customer_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{order.phone || 'No Phone'}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{order.items}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">₹{order.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isPricePending 
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : order.status === 'Delivered' || order.status === 'Confirmed'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : order.status === 'Rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {isPricePending ? '⏳ Price Confirmation' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4">
                          {isPricePending ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const newAmount = prompt(`Enter final amount (Current: ₹${order.amount}):`, String(order.amount));
                                  if (newAmount && !isNaN(Number(newAmount))) {
                                    confirmPrice(order.id, Number(newAmount));
                                  }
                                }}
                                className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-200 transition font-semibold"
                              >
                                Confirm Price
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'Rejected')}
                                className="text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-200 transition font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          )}
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
    </div>
  );
}
