'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState('Checking localStorage...');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    const info = `Email: "${email}" | Role: "${role}"`;
    setDebugInfo(info);
    console.log('🔍 ADMIN DASHBOARD CHECK:', info);

    // TEMPORARY: Redirect hata diya hai taaki hum dekh sakein ki page load ho bhi raha hai ya nahi
    // Agar email admin@quickcart.com hai, tabhi aage ka data fetch hoga
    
    if (email === 'devbusines01@gmail.com') {
      console.log('✅ Admin verified! Fetching data...');
      // Yahan baad mein hum supabase fetch wapas laga denge
      setUsers([{ name: 'Test User', email: 'test@example.com', shop_name: 'Test Shop', subscription_status: 'active', created_at: new Date().toISOString() }]);
    } else {
      console.log('⚠️ Email match nahi hui. Redirect nahi ho raha (Debug Mode).');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-200">
        <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Admin Dashboard Loaded!</h1>
        
        <div className="bg-gray-100 p-4 rounded-lg mb-6 font-mono text-sm">
          <p className="font-bold text-gray-700 mb-2">🔍 Debug Info:</p>
          <p>{debugInfo}</p>
          <p className="text-xs text-gray-500 mt-2">
            (Agar upar "devbusines01@gmail.com" dikh raha hai, toh login 100% successful hai!)
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Registered Shop Owners</h2>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border">Name</th>
                    <th className="p-3 border">Shop</th>
                    <th className="p-3 border">Email</th>
                    <th className="p-3 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 border">{u.name}</td>
                      <td className="p-3 border">{u.shop_name}</td>
                      <td className="p-3 border">{u.email}</td>
                      <td className="p-3 border">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {u.subscription_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No users found yet.</p>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => { 
              localStorage.removeItem('userEmail'); 
              localStorage.removeItem('userRole'); 
              window.location.replace('/login'); 
            }} 
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            🚪 Logout
          </button>
          <a 
            href="/dashboard" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center"
          >
            Go to User Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
