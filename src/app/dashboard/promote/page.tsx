'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PromotePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      setUserEmail(email);
      fetchShopDetails(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchShopDetails(email: string) {
    const { data } = await supabase.from('leads').select('shop_name, bot_username').eq('email', email).single();
    if (data) {
      const username = data.bot_username || 'YourBot';
      setShopName(data.shop_name || 'Your Shop');
      setBotUsername(username);
      
      // Generate QR Code URL using actual Telegram link
      const botLink = `https://t.me/${username}`;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(botLink)}`;
      setQrCodeUrl(qrApi);
    }
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const botLink = `https://t.me/${botUsername}`;
  const shareMessage = ` *${shopName}*\n\nAb ghar baithe order karein! Hamara Telegram Bot use karein:\n${botLink}\n\nFast delivery, best prices! 🚀`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const telegramShareLink = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2">← Back to Dashboard</button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📣 Promote Your Shop</h1>
        <p className="text-gray-600 mb-8">Share your bot link with customers and grow your business!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. QR CODE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📱 QR Code</h2>
            <p className="text-sm text-gray-600 mb-4">Print this QR code and display it at your shop. Customers can scan to order!</p>
            
            {qrCodeUrl && (
              <div className="flex flex-col items-center">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border-4 border-blue-100 rounded-lg mb-4" />
                <button 
                  onClick={async () => {
                    try {
                      // Fetch the QR code image
                      const response = await fetch(qrCodeUrl);
                      const blob = await response.blob();
                      
                      // Create download link
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${shopName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      
                      alert('✅ QR Code downloaded successfully!');
                    } catch (error) {
                      console.error('Download error:', error);
                      alert('❌ Failed to download QR Code. Please try again.');
                    }
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span>📥</span>
                  <span>Download QR Code</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. SOCIAL MEDIA SHARE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📤 Share on Social Media</h2>
            <p className="text-sm text-gray-600 mb-4">Share your bot link on WhatsApp, Telegram, and Facebook!</p>
            
            <div className="space-y-3">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition">
                <span className="text-2xl">📱</span>
                <span className="font-semibold">Share on WhatsApp</span>
              </a>
              
              <a href={telegramShareLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition">
                <span className="text-2xl">✈️</span>
                <span className="font-semibold">Share on Telegram</span>
              </a>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(botLink);
                  alert('Bot link copied to clipboard!');
                }}
                className="flex items-center gap-3 w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                <span className="text-2xl">📋</span>
                <span className="font-semibold">Copy Bot Link</span>
              </button>
            </div>
          </div>

          {/* 3. YOUR BOT LINK */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-2">🔗 Your Bot Link</h2>
            <p className="text-blue-100 mb-4">Share this link with your customers:</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 flex items-center justify-between">
              <code className="text-lg font-mono">{botLink}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(botLink);
                  alert('Link copied!');
                }}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Copy
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
