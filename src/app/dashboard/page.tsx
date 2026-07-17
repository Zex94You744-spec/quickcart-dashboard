'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock Orders Data (Jab Telegram bot connect hoga, ye real database se aayega)
const MOCK_ORDERS = [
  { id: 'ORD-1001', customer: 'Amit Sharma', items: 'Rice 5kg, Oil 1L', amount: 650, status: 'Completed', date: '2026-07-17' },
  { id: 'ORD-1002', customer: 'Priya Singh', items: 'Milk 2L, Bread', amount: 120, status: 'Pending', date: '2026-07-17' },
  { id: 'ORD-1003', customer: 'Vikram Patel', items: 'Soap 5pcs, Biscuits', amount: 250, status: 'Completed', date: '2026-07-16' },
];

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      fetchUser(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchUser(email: string) {
    const { data } = await supabase.from('leads').select('*').eq('email', email).single();
    if (data) setUser(data);
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading your business dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">User not found.</p>
          <a href="/login" className="text-blue-600 hover:underline font-semibold">Login again</a>
        </div>
      </div>
    );
  }
  const isPaid = user.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600">QuickCart</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800 text-lg">{user.shop_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isPaid ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
            {isPaid ? '✅ Active Plan' : '⏳ Trial Mode'}
          </span>
          <button 
            onClick={() => { localStorage.removeItem('userEmail'); router.push('/login'); }} 
            className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
          <p className="text-gray-600 mt-1">Here is an overview of your store's performance today.</p>
        </div>

        {/* 2. Conditional Alert Banner */}
        {!isPaid ? (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                <span>⏳</span> Your Free Trial is Active
              </h3>
              <p className="text-orange-700 mt-1">Complete your payment to unlock unlimited orders, advanced analytics, and CSV exports.</p>
            </div>
            <a 
              href={`/checkout?lead_id=${user.id}`} 
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition shadow-md whitespace-nowrap flex items-center gap-2"
            >
              💳 Complete Payment Now
            </a>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">            <div>
              <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                <span>🎉</span> Your Account is Fully Active!
              </h3>
              <p className="text-green-700 mt-1">Your bot is ready to take orders. Make sure it is set up correctly.</p>
            </div>
            <a 
              href="/bot-setup" 
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-md whitespace-nowrap flex items-center gap-2"
            >
              ⚙️ Bot Setup Guide
            </a>
          </div>
        )}

        {/* 3. Business Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
            <p className="text-xs text-green-600 mt-2 font-medium">↑ 12% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">₹4,250</p>
            <p className="text-xs text-green-600 mt-2 font-medium">↑ 8% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Pending Orders</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">3</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">Needs your attention</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Bot Status</p>
            <p className={`text-3xl font-bold mt-2 ${isPaid ? 'text-green-600' : 'text-gray-400'}`}>
              {isPaid ? 'Connected' : 'Inactive'}
            </p>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {isPaid ? 'Receiving orders' : 'Upgrade to activate'}
            </p>
          </div>
        </div>

        {/* 4. Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a href="/bot-setup" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition flex items-center gap-4 group">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">⚙️</div>
            <div>
              <h3 className="font-bold text-gray-900">Bot Setup Guide</h3>
              <p className="text-sm text-gray-500">Connect your Telegram bot</p>            </div>
          </a>
          <a href="mailto:support@quickcart.com" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition flex items-center gap-4 group">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">📧</div>
            <div>
              <h3 className="font-bold text-gray-900">Contact Support</h3>
              <p className="text-sm text-gray-500">Get help from our team</p>
            </div>
          </a>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 opacity-60 cursor-not-allowed flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <h3 className="font-bold text-gray-900">Export Data (CSV)</h3>
              <p className="text-sm text-gray-500">Available in Pro & Premium</p>
            </div>
          </div>
        </div>

        {/* 5. Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline">View All Orders →</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MOCK_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{order.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{order.items}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{order.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'Completed' ? '✓ ' : '⏳ '}{order.status}                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Info Note */}
          <div className="px-6 py-4 bg-blue-50/50 border-t border-blue-100">
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <span className="text-lg">ℹ️</span> 
              <span><strong>Note:</strong> These are sample orders to demonstrate your dashboard layout. Once your Telegram bot is connected and live, real customer orders will appear here automatically in real-time.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
