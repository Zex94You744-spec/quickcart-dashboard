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
  const [adminEmail, setAdminEmail] = useState('');
  
  // Reset Password Modal States
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    setAdminEmail(email || '');

    if (!email || (email !== 'devbusines01@gmail.com' && email !== 'support@quickcart.com' && role !== 'admin')) {
      window.location.replace('/login');
      return;
    }
    
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        const realUsers = data.filter(u => 
          u.email !== 'devbusines01@gmail.com' && 
          u.email !== 'support@quickcart.com' &&
          u.email !== 'support@quickcart.com.com'
        );
        setUsers(realUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  // ✅ STRICT CHECK: Sirf status ke basis par active count karega
  const isActiveUser = (u: any) => {
    return u.subscription_status === 'active' || 
           u.subscription_status === 'paid' || 
           u.subscription_status === 'premium';
  };

  // 🔑 Admin Reset Password Function
  async function handleGenerateResetLink(email: string) {
    setTargetUserEmail(email);
    setResetLink('Generating secure link...');
    setResetModalOpen(true);

    try {
      const response = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: adminEmail, targetEmail: email })
      });
      const result = await response.json();
      
      if (result.success) {
        setResetLink(result.resetLink);
      } else {
        setResetLink('Error: ' + (result.error || 'Failed to generate link'));
      }
    } catch (error) {
      setResetLink('Failed to connect to server.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.location.replace('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading Admin Dashboard...</div>
      </div>
    );
  }

  const activeCount = users.filter(u => isActiveUser(u)).length;
  const trialCount = users.filter(u => !isActiveUser(u)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600">QuickCart Admin</span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            {adminEmail}
          </span>
        </div>
        <button 
          onClick={handleLogout} 
          className="text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium"
        >
          🚪 Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Overview 👋</h1>
          <p className="text-gray-600 mt-1">Manage all registered shop owners and view platform statistics.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Shop Owners</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Active Subscriptions</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Trial / New Users</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{trialCount}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Registered Shop Owners</h2>
            <button onClick={fetchUsers} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              🔄 Refresh
            </button>
          </div>
          
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No shop owners registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Shop Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {users.map((user) => {
                    const isPaid = isActiveUser(user);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{user.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{user.shop_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-gray-600">{user.phone || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isPaid
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {isPaid ? `✅ ${user.subscription_plan ? user.subscription_plan.toUpperCase() : 'ACTIVE'}` : '⏳ Trial'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleGenerateResetLink(user.email)}
                            className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition font-semibold flex items-center gap-1"
                          >
                             Reset Password
                          </button>
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

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2"> Password Reset Link</h3>
            <p className="text-sm text-gray-600 mb-4">
              User: <span className="font-semibold text-gray-800">{targetUserEmail}</span><br/>
              ⚠️ This link will expire in <span className="text-red-600 font-bold">5 minutes</span>. Copy and send it to the user immediately.
            </p>
            
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 mb-4 break-all text-sm font-mono text-gray-800 max-h-32 overflow-y-auto">
              {resetLink}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  navigator.clipboard.writeText(resetLink); 
                  alert('Link copied to clipboard!'); 
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                📋 Copy Link
              </button>
              <button 
                onClick={() => setResetModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
