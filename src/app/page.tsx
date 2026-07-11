'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
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
    
    // User ki shop ID dhundo
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
    if (data) { setOrders(data); setLoading(false); }
  }

  async function updateStatus(orderId, newStatus) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, newStatus }) });
      fetchOrders(shopId);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();    router.push('/login');
  };

  function getStatusColor(status) {
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QuickCart Admin</h1>
            <p className="text-gray-600 mt-1">Logged in as: {userEmail}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600">Total Orders</div><div className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</div></div>
          <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600">Pending</div><div className="text-3xl font-bold text-yellow-600 mt-2">{orders.filter(o => o.status === 'pending').length}</div></div>
          <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600">Delivered</div><div className="text-3xl font-bold text-green-600 mt-2">{orders.filter(o => o.status === 'delivered').length}</div></div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-xl font-semibold text-gray-900">My Shop Orders</h2></div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No orders for your shop yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.created_id).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900"><ul className="list-disc list-inside">{Array.isArray(order.items) ? order.items.map((item, idx) => <li key={idx}>{item}</li>) : <li>{order.items}</li>}</ul></td>
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
