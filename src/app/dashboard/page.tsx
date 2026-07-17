'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock Orders Data (Jab Telegram bot connect hoga, ye real database se aayega)
const MOCK_ORDERS = [
  { id: 'ORD-001', customer: 'Amit Sharma', items: 'Rice 5kg, Oil 1L', amount: 650, status: 'Completed', date: '2026-07-17' },
  { id: 'ORD-002', customer: 'Priya Singh', items: 'Milk 2L, Bread', amount: 120, status: 'Pending', date: '2026-07-17' },
  { id: 'ORD-003', customer: 'Vikram Patel', items: 'Soap 5pcs, Biscuits', amount: 250, status: 'Completed', date: '2026-07-16' },
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
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .single();

    if (data) {
      setUser(data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading your business dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">        User not found. <a href="/login" className="text-blue-600 underline ml-2">Login again</a>
      </div>
    );
  }

  const isPaid = user.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar for User */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600">QuickCart</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-700">{user.shop_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {isPaid ? 'ACTIVE PLAN' : 'TRIAL MODE'}
          </span>
          <button 
            onClick={() => {
              localStorage.removeItem('userEmail');
              router.push('/login');
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
          <p className="text-gray-600 mt-1">Here is what is happening with your store today.</p>
        </div>

        {/* If Not Paid, Show Upgrade Banner */}
        {!isPaid && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-orange-800">⏳ Your Free Trial is Active</h3>
              <p className="text-orange-700 mt-1">Complete your payment to unlock unlimited orders and advanced features.</p>
            </div>
            <a 
              href={`/checkout?lead_id=${user.id}`} 
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition shadow-md whitespace-nowrap"
            >              💳 Complete Payment Now
            </a>
          </div>
        )}

        {/* Business Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Orders (Demo)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Revenue (Demo)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">₹4,250</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Pending Orders</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">3</p>
            <p className="text-xs text-gray-500 mt-1">Needs your attention</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
          </div>
          
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MOCK_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{order.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-600">{order.items}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{order.amount}</td>                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Note for Demo */}
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <span>ℹ️</span> 
              <span>Note: These are sample orders to show you how your dashboard will look. Once your Telegram bot is connected, real customer orders will appear here automatically.</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/bot-setup" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition flex items-center gap-4 group">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">⚙️</div>
            <div>
              <h3 className="font-bold text-gray-900">Setup Telegram Bot</h3>
              <p className="text-sm text-gray-500">Connect your store to start receiving orders.</p>
            </div>
          </a>
          <a href="/landing" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-300 transition flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">🏠</div>
            <div>
              <h3 className="font-bold text-gray-900">Back to Home</h3>
              <p className="text-sm text-gray-500">Visit our main website.</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
