'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // DEBUG ALERT 1: Ye hamesha aayega jab button dabayega
    alert('Step 1: Login button dabaya gaya! Email: ' + email);
    setLoading(true);
    setError('');

    try {
      // DEBUG ALERT 2: Admin check
      if (email.trim() === 'devbusines01@gmail.com' && password === 'TaYOpc9THewup94D6429qC3vxe+fZFKp') {
        alert('Step 2: Admin credentials match ho gaye! Redirecting...');
        localStorage.setItem('userEmail', 'devbusines01@gmail.com');
        localStorage.setItem('userRole', 'admin');
        
        // Window location use karte hain agar router.push kaam na kare
        window.location.href = '/admin/dashboard';
        return;
      }

      alert('Step 3: Admin nahi hai, database check kar rahe hain...');
      
      // Yahan se normal user login ka code hai (agar tu admin se login kar raha hai toh ye skip ho jayega)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: userData, error: userError } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        alert('Step 4: User database mein nahi mila!');
        setError('Invalid email or password');
        setLoading(false);
        return;      }

      if (String(userData.password).trim() !== String(password).trim()) {
        alert('Step 5: Password match nahi hua!');
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      alert('Step 6: Login successful! Redirecting to User Dashboard...');
      localStorage.setItem('userEmail', email.trim());
      localStorage.setItem('userRole', userData.role || 'user');
      window.location.href = '/dashboard';

    } catch (err: any) {
      alert('Step 7: Koi Error aaya! ' + err.message);
      setError('An error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">QuickCart</h1>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-1">Login to your QuickCart dashboard</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="devbusines01@gmail.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="example@123"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : '🔐 Login to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  );
}
