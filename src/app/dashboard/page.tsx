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
  
  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    if (email) {
      if (role === 'admin' || email === 'devbusines01@gmail.com' || email === 'support@quickcart.com') {
        window.location.replace('/admin/dashboard');
        return;
      }
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
          .eq('shop_owner_email', email) 
          .order('created_at', { ascending: false })
          .limit(20);
        if (ordersData) setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return;
    
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const result = await response.json();
      if (result.success) {
        alert('Account deleted successfully.');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        window.location.replace('/login');
      } else {
        alert('Failed to delete account: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete account.');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading your business dashboard...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><p className="text-gray-600 mb-4">User not found.</p><a href="/login" className="text-blue-600 hover:underline font-semibold">Login again</a></div></div>;

  const isPaid = user.subscription_status === 'active' || user.subscription_status === 'paid' || user.subscription_status === 'premium';
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days.map(date => {
      const dayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(date) && (o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Confirmed'));
      const revenue = dayOrders.reduce((sum, o) => sum + (Number(order.amount) || 0), 0);
      return { date: date.slice(5), revenue };
    });
  };
  const chartData = getLast7DaysData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600 tracking-tight">QuickCart</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800 text-lg">{user.shop_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isPaid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
            {isPaid ? `✅ ${user.subscription_plan ? user.subscription_plan.toUpperCase() : 'ACTIVE'} PLAN` : '⏳ TRIAL MODE'}
          </span>
          <button onClick={() => { localStorage.removeItem('userEmail'); router.push('/login'); }} className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
            <p className="text-gray-500 mt-1">Here is an overview of your store performance today.</p>
          </div>
          {!isPaid && (
            <a href={`/checkout?lead_id=${user.id}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-200 flex items-center gap-2 whitespace-nowrap"> Complete Payment Now</a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Orders', value: totalOrders, color: 'text-gray-900', icon: '📦' },
            { label: 'Total Revenue', value: `₹${totalRevenue}`, color: 'text-green-600', icon: '💰' },
            { label: 'Pending Orders', value: pendingOrders, color: 'text-orange-600', icon: '⏳' },
            { label: 'Bot Status', value: isPaid ? 'Connected' : 'Inactive', color: isPaid ? 'text-green-600' : 'text-gray-400', icon: '' }
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

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue Overview (Last 7 Days)</h2>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Completed Orders Only</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {chartData.map((day, idx) => {
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div className="w-full max-w-[40px] bg-blue-100 rounded-t-lg group-hover:bg-blue-200 transition-all duration-300 relative" style={{ height: `${Math.max(heightPercent, 4)}px` }}>
                      {day.revenue > 0 && (<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">₹{day.revenue}</div>)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/dashboard/orders" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">📦</div>
            <div><h3 className="font-bold text-gray-900 text-lg">Manage Orders</h3><p className="text-sm text-gray-500">View, confirm or reject all orders</p></div>
          </a>
          <a href="/analytics" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">📊</div>
            <div><h3 className="font-bold text-gray-900 text-lg">View Analytics</h3><p className="text-sm text-gray-500">Detailed sales charts and insights</p></div>
          </a>
          <a href="/bot-setup" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">⚙️</div>
            <div><h3 className="font-bold text-gray-900 text-lg">Bot Setup Guide</h3><p className="text-sm text-gray-500">Connect your Telegram bot</p></div>
          </a>
        </div>

        {/* Account & Billing Settings Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account & Billing Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">💳</div>
                  <h3 className="font-bold text-gray-900 text-lg">Billing & Subscription</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Current Plan: <span className="font-semibold text-green-600">{user.subscription_plan ? user.subscription_plan.toUpperCase() : 'TRIAL'}</span>
                </p>
              </div>
              <a href={`/checkout?lead_id=${user.id}`} className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-semibold text-center">
                {isPaid ? 'Manage / Upgrade Subscription' : 'Upgrade Plan Now'}
              </a>
            </div>

            {/* Delete Account Card */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl">🗑️</div>
                  <h3 className="font-bold text-gray-900 text-lg">Danger Zone</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button onClick={() => setShowDeleteModal(true)} className="w-full bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition font-semibold text-center">
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-600 mb-2">⚠️ Delete Account?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete your account? All your orders, data, and subscription will be permanently lost.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700 mb-2">
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yes, Delete Permanently
              </button>
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
