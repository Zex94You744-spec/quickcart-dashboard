'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>({
    totalRevenue: 0,
    weeklyData: [],
    topItems: [],
    statusData: []
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserEmail(user.email || '');
    
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_email', user.email).single();
    if (shop) {
      setShopId(shop.id);
      fetchOrders(shop.id);
    } else {
      setLoading(false);
    }
  }

  async function fetchOrders(sId: string) {
    const { data, error } = await supabase.from('orders').select('*').eq('shop_id', sId).order('created_id', { ascending: false });
    if (data) { 
      setOrders(data); 
      calculateAnalytics(data);
      setLoading(false); 
    }  }

  function calculateAnalytics(orders: any[]) {
    // 1. Total Revenue (Assuming average order value ₹500)
    const totalRevenue = orders.length * 500;
    
    // 2. Weekly Sales Data (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    const weeklyData = last7Days.map(day => ({
      day,
      orders: Math.floor(Math.random() * 10) + 1 // Mock data - replace with real calculation
    }));
    
    // 3. Top Selling Items
    const itemCounts: any = {};
    orders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: string) => {
          itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
      }
    });
    
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);
    
    // 4. Order Status Distribution
    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };
    
    const statusData = [
      { name: 'Pending', value: statusCounts.pending },
      { name: 'Accepted', value: statusCounts.accepted },
      { name: 'Delivered', value: statusCounts.delivered }
    ].filter(item => item.value > 0);
    
    setAnalytics({ totalRevenue, weeklyData, topItems, statusData });
  }

  async function updateStatus(orderId: string, newStatus: string) {
  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  if (!error) {
    // Agar delivered mark kiya, toh PDF invoice generate kar
    if (newStatus === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await generateAndSendInvoice(order);
      }
    }
    
    await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, newStatus }) });
    if (shopId) fetchOrders(shopId);
  }
}

async function generateAndSendInvoice(order: any) {
  try {
    const response = await fetch('/api/generate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Telegram bot ko PDF bhejne ke liye API call
      await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: order.chat_id,
          pdf: data.pdf,
          filename: data.filename
        })
      });
    }
  } catch (error) {
    console.error('Invoice generation error:', error);
  }
}

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  function getStatusColor(status: string) {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QuickCart Admin</h1>
            <p className="text-gray-600 mt-1">Logged in as: {userEmail}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600 mt-2">₹{analytics.totalRevenue}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{orders.filter(o => o.status === 'pending').length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">            <div className="text-sm text-gray-600">Delivered</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{orders.filter(o => o.status === 'delivered').length}</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Sales Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 Weekly Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#0088FE" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Top Selling Items</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#00C49F" name="Times Ordered" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Order Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"                  dataKey="value"
                >
                  {analytics.statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Quick Insights</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-gray-700">Avg Orders/Day</span>
                <span className="font-bold text-blue-600">{(orders.length / 7).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">Delivery Rate</span>
                <span className="font-bold text-green-600">
                  {orders.length > 0 ? ((orders.filter(o => o.status === 'delivered').length / orders.length) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-gray-700">Top Item</span>
                <span className="font-bold text-purple-600">
                  {analytics.topItems[0]?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No orders for your shop yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.created_id).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900"><ul className="list-disc list-inside">{Array.isArray(order.items) ? order.items.map((item: string, idx: number) => <li key={idx}>{item}</li>) : <li>{order.items}</li>}</ul></td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.status === 'pending' && <button onClick={() => updateStatus(order.id, 'accepted')} className="text-blue-600 hover:text-blue-900 mr-3">Accept</button>}
                        {order.status === 'accepted' && <button onClick={() => updateStatus(order.id, 'delivered')} className="text-green-600 hover:text-green-900">Mark Delivered</button>}
                        {order.status === 'delivered' && <span className="text-gray-400">Completed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
