'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      fetchUserData(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchUserData(email: string) {
    try {
      const { data: userData } = await supabase.from('leads').select('*').eq('email', email).single();
      if (userData) {
        setUser(userData);
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20); // Thode zyada orders chart ke liye
        if (ordersData) setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { data: orderData } = await supabase.from('orders').select('customer_chat_id').eq('id', orderId).single();
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (!error) {
      if (orderData?.customer_chat_id) {
        const message = newStatus === 'Completed'           ? `✅ Aapka order confirm ho gaya hai!\n\nHum jald hi deliver karenge. Dhanyawad!`
          : `❌ Maafi chahte hain, lekin aapka order reject kar diya gaya hai.\n\nKisi aur samay order karein.`;
        
        try {
          await fetch('/api/send-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: orderData.customer_chat_id, message })
          });
        } catch (err) { console.error('Telegram send failed:', err); }
      }
      fetchUserData(localStorage.getItem('userEmail') || ''); // Refresh data
      alert(`Order ${newStatus === 'Completed' ? 'Confirmed' : 'Rejected'}! Customer notified.`);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading your business dashboard...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><a href="/login" className="text-blue-600 hover:underline font-semibold">Login again</a></div>;

  const isPaid = user.subscription_status === 'active';
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  // --- MINI CHART LOGIC (Last 7 Days Revenue) ---
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
    }
    
    return days.map(date => {
      const dayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(date) && o.status === 'Completed');
      const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      return { date: date.slice(5), revenue }; // "MM-DD" format
    });
  };
  const chartData = getLast7DaysData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100); // Avoid divide by zero
  // ------------------------------------------------

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 1. Clean Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">          <span className="text-2xl font-bold text-blue-600 tracking-tight">QuickCart</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800 text-lg">{user.shop_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isPaid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
            {isPaid ? '✅ Active Plan' : '⏳ Trial Mode'}
          </span>
          <button onClick={() => { localStorage.removeItem('userEmail'); router.push('/login'); }} className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* 2. Welcome & Alert */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
            <p className="text-gray-500 mt-1">Here is an overview of your store performance today.</p>
          </div>
          {!isPaid && (
            <a href={`/checkout?lead_id=${user.id}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-200 flex items-center gap-2 whitespace-nowrap">
              💳 Complete Payment Now
            </a>
          )}
        </div>

        {/* 3. Stats Cards (Better Spacing & Shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Orders', value: totalOrders, color: 'text-gray-900', icon: '📦' },
            { label: 'Total Revenue', value: `₹${totalRevenue}`, color: 'text-green-600', icon: '💰' },
            { label: 'Pending Orders', value: pendingOrders, color: 'text-orange-600', icon: '⏳' },
            { label: 'Bot Status', value: isPaid ? 'Connected' : 'Inactive', color: isPaid ? 'text-green-600' : 'text-gray-400', icon: '🤖' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 4. NEW: Mini Revenue Chart (Last 7 Days) */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">            <h2 className="text-lg font-bold text-gray-900">Revenue Overview (Last 7 Days)</h2>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Completed Orders Only</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {chartData.map((day, idx) => {
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className="w-full max-w-[40px] bg-blue-100 rounded-t-lg group-hover:bg-blue-200 transition-all duration-300 relative"
                      style={{ height: `${Math.max(heightPercent, 4)}px` }}
                    >
                      {day.revenue > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{day.revenue}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { href: '/analytics', icon: '📊', title: 'View Analytics', desc: 'Detailed sales charts & insights', color: 'indigo' },
            { href: '/bot-setup', icon: '⚙️', title: 'Bot Setup Guide', desc: 'Connect your Telegram bot', color: 'blue' },
            { href: 'mailto:support@quickcart.com', icon: '📧', title: 'Contact Support', desc: 'Get help from our team', color: 'purple' }
          ].map((action, idx) => (
            <a key={idx} href={action.href} className={`bg-white p-6 rounded-2xl border border-gray-100 hover:border-${action.color}-300 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group`}>
              <div className={`w-14 h-14 bg-${action.color}-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{action.title}</h3>
                <p className="text-sm text-gray-500">{action.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* 6. Recent Orders Table (Cleaner & Spacious) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>          </div>
          
          {orders.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium text-gray-900">No orders yet.</p>
              <p className="text-sm mt-1">Send a test order from your Telegram bot to see it here!</p>
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
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-8 py-5 font-mono font-medium text-blue-600">#{order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A'}</td>
                      <td className="px-8 py-5 font-medium text-gray-900">{order.customer_name || 'Unknown'}</td>
                      <td className="px-8 py-5 text-gray-600 max-w-xs truncate" title={order.items}>{order.items}</td>
                      <td className="px-8 py-5 font-bold text-gray-900">₹{order.amount || 0}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' : 
                          order.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 
                          'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {order.status === 'Completed' ? '✓ ' : order.status === 'Rejected' ? '✗ ' : '⏳ '}{order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-8 py-5">
                        {order.status === 'Pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">
                              ✅ Confirm
                            </button>
                            <button onClick={() => updateOrderStatus(order.id, 'Rejected')} className="text-xs bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition font-semibold">
                              ❌ Reject
                            </button>
                          </div>
                        ) : (                          <span className="text-xs text-gray-400 font-medium italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="px-8 py-4 bg-blue-50/50 border-t border-blue-100">
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <span className="text-lg mt-0.5">ℹ️</span> 
              <span><strong>Live Data:</strong> Orders received via your Telegram bot will appear here automatically in real-time.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
