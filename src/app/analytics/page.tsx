'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AnalyticsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
    if (data) setOrders(data);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading analytics...</div>;

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const maxAmount = Math.max(...orders.map(o => Number(o.amount) || 0), 100);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics 📊</h1>
            <p className="text-gray-600">Track your store's performance over time.</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
            ← Back to Dashboard
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Completed Orders</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{completedOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">₹{totalRevenue}</p>
          </div>
        </div>

        {/* Simple CSS Bar Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders Revenue</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No order data available yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.slice(-10).reverse().map((order, idx) => {
                const widthPercent = ((Number(order.amount) || 0) / maxAmount) * 100;
                return (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500 truncate">
                      {order.customer_name}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
                      <div 
                        className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 5)}%` }}
                      >
                        <span className="text-white text-xs font-bold">₹{order.amount || 0}</span>
                      </div>
                    </div>
                    <div className="w-20 text-xs text-gray-400 text-right">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
