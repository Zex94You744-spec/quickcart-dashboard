'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    console.log('🔍 Admin Dashboard checking auth:', { email, role });

    // Check if admin (thoda flexible check)
    if (!email || (email !== 'devbusines01@gmail.com' && role !== 'admin')) {
      console.log('🚫 Not admin, redirecting to login');
      router.push('/login');
      return;
    }
    
    console.log('✅ Admin verified, fetching users...');
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .neq('email', 'devbusines01@gmail.com'); // Admin ko exclude karo
      
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600">QuickCart Admin</span>
        </div>        <button 
          onClick={() => { 
            localStorage.removeItem('userEmail'); 
            router.push('/login'); 
          }} 
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard 👋</h1>
          <p className="text-gray-600 mt-1">Manage all shop owners and view platform statistics.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Shop Owners</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Active Subscriptions</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {users.filter(u => u.subscription_status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Trial Users</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {users.filter(u => u.subscription_status !== 'active').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">All Shop Owners</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Shop Name</th>
                  <th className="px-6 py-4">Email</th>                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.shop_name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.subscription_status === 'active' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {user.subscription_status === 'active' ? '✅ Active' : '⏳ Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
