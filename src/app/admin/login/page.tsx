'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Hardcoded Admin Check (Secure aur Simple)
    const ADMIN_EMAIL = 'devbusines01@gmail.com';
    const ADMIN_PASSWORD = 'TaYOpc9THewup94D6429qC3vxe+fZFKp';

    if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      localStorage.setItem('userEmail', formData.email);
      document.cookie = "isAdmin=true; path=/; max-age=86400";
      router.push('/admin/leads');
    } else {
      alert('Invalid Admin Credentials!');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-t-4 border-blue-600">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">Restricted Access. Authorized personnel only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="admin@quickcart.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="••••••••" />
          </div>

          {/* 👇 YAHAN KOI FORGOT PASSWORD NAHI HAI */}

          <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-semibold disabled:bg-gray-400">
            {loading ? 'Verifying...' : '🔐 Access Admin Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/landing" className="text-gray-500 hover:text-gray-700 text-sm">← Back to Public Website</a>
        </div>
      </div>
    </div>
  );
}
