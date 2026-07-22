'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BotSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [botToken, setBotToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
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
        if (userData.bot_token) {
          setBotToken(userData.bot_token);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToken() {
    if (!botToken.trim()) {
      setError('Please enter your bot token');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      // Database mein token save karo
      const { error: updateError } = await supabase
        .from('leads')
        .update({ bot_token: botToken.trim() })
        .eq('email', user.email);

      if (updateError) throw updateError;

      // Webhook set karo
      const webhookResponse = await fetch('/api/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim() })
      });

      const webhookResult = await webhookResponse.json();

      if (webhookResult.success) {
        setMessage('✅ Bot connected successfully! Webhook is now active.');
      } else {
        setMessage('⚠️ Token saved, but webhook setup failed. Please try again.');
      }
    } catch (error: any) {
      setError('Failed to save token: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!botToken.trim()) {
      setError('Please save your bot token first');
      return;
    }

    setTesting(true);
    setTestResult('');

    try {
      const response = await fetch('/api/test-bot-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setTestResult(`✅ Connection successful! Bot name: ${result.botName}`);
      } else {
        setTestResult(`❌ Connection failed: ${result.error}`);
      }
    } catch (error: any) {
      setTestResult('❌ Test failed: ' + error.message);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">🤖 Bot Setup Guide</h1>
          <p className="text-gray-600 mt-2">Connect your Telegram bot to receive orders automatically.</p>
        </div>

        {/* Step-by-Step Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📋 How to Create Your Telegram Bot</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Open Telegram and Search for BotFather</h3>
                <p className="text-gray-600 text-sm">
                  In Telegram, search for <code className="bg-gray-100 px-2 py-1 rounded">@BotFather</code> and start a chat.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Create a New Bot</h3>
                <p className="text-gray-600 text-sm">
                  Send the command <code className="bg-gray-100 px-2 py-1 rounded">/newbot</code> to BotFather.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Choose a Name for Your Bot</h3>
                <p className="text-gray-600 text-sm">
                  BotFather will ask for a name (e.g., "My Shop Bot"). Choose any name you like.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Choose a Username for Your Bot</h3>
                <p className="text-gray-600 text-sm">
                  BotFather will ask for a username (must end with "bot", e.g., "myshop_bot").
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">5</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Copy Your Bot Token</h3>
                <p className="text-gray-600 text-sm">
                  BotFather will give you a token like: <code className="bg-gray-100 px-2 py-1 rounded text-xs">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>
                  <br/>
                  <span className="text-red-600 font-semibold">⚠️ Keep this token secret! Never share it with anyone.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🔑 Enter Your Bot Token</h2>

          {message && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Paste the token you received from BotFather
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveToken}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : '💾 Save & Connect Bot'}
              </button>
              
              <button
                onClick={handleTestConnection}
                disabled={testing || !botToken.trim()}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing...' : '🧪 Test Connection'}
              </button>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg text-sm ${testResult.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Webhook Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• When you save your bot token, we automatically set up a webhook with Telegram</li>
            <li>• All orders sent to your bot will be automatically routed to your dashboard</li>
            <li>• You can test the connection anytime using the "Test Connection" button</li>
            <li>• Your bot token is encrypted and stored securely</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
