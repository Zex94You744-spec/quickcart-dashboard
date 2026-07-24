'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const languages = [
  { code: 'odia', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'hindi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'english', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'bengali', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'marathi', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gujarati', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'punjabi', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'tamil', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'telugu', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'malayalam', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'assamese', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'urdu', name: 'Urdu', native: 'اردو', flag: '🇮🇳' },
  { code: 'bhojpuri', name: 'Bhojpuri', native: 'भोजपुरी', flag: '🇮🇳' },
  { code: 'rajasthani', name: 'Rajasthani', native: 'राजस्थानी', flag: '🇮🇳' },
  { code: 'haryanvi', name: 'Haryanvi', native: 'हरियाणवी', flag: '🇮🇳' },
  { code: 'chhattisgarhi', name: 'Chhattisgarhi', native: 'छत्तीसगढ़ी', flag: '🇮🇳' },
  { code: 'konkani', name: 'Konkani', native: 'कोंकणी', flag: '🇮🇳' },
  { code: 'manipuri', name: 'Manipuri', native: 'ꯃꯤꯇꯩꯂꯣꯟ', flag: '🇮🇳' },
  { code: 'nepali', name: 'Nepali', native: 'नेपाली', flag: '🇮🇳' },
  { code: 'sindhi', name: 'Sindhi', native: 'سنڌي', flag: '🇮🇳' },
  { code: 'kashmiri', name: 'Kashmiri', native: 'کٲشُر', flag: '🇮🇳' },
  { code: 'dogri', name: 'Dogri', native: 'डोगरी', flag: '🇮🇳' },
  { code: 'maithili', name: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
  { code: 'santhali', name: 'Santhali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
  { code: 'tulu', name: 'Tulu', native: 'ತುಳು', flag: '🇮🇳' },
  { code: 'bodo', name: 'Bodo', native: 'बड़ो', flag: '🇮🇳' },
  { code: 'mizo', name: 'Mizo', native: 'Mizo', flag: '🇮🇳' },
  { code: 'gondi', name: 'Gondi', native: 'गोंडी', flag: '🇮🇳' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Language State
  const [language, setLanguage] = useState('hindi');
  
  // Shop Details State
  const [shopAddress, setShopAddress] = useState('');
  const [shopBlock, setShopBlock] = useState('');
  const [shopDistrict, setShopDistrict] = useState('');
  const [shopState, setShopState] = useState('');
  const [shopPincode, setShopPincode] = useState('');
  const [botUsername, setBotUsername] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      fetchUserData(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchUserData(email: string) {
    const { data } = await supabase.from('leads').select('*').eq('email', email).single();
    if (data) {
      setUser(data);
      setLanguage(data.preferred_language || 'hindi');
      setShopAddress(data.shop_address || '');
      setShopBlock(data.shop_block || '');
      setShopDistrict(data.shop_district || '');
      setShopState(data.shop_state || '');
      setShopPincode(data.shop_pincode || '');
      setBotUsername(data.bot_username || '');
    }
    setLoading(false);
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('leads')
      .update({ 
        preferred_language: language,
        shop_address: shopAddress,
        shop_block: shopBlock,
        shop_district: shopDistrict,
        shop_state: shopState,
        shop_pincode: shopPincode,
        bot_username: botUsername
      })
      .eq('email', user.email);
    
    if (!error) {
      alert('✅ Settings saved successfully!');
    } else {
      alert('Failed to save settings: ' + error.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2">← Back to Dashboard</button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Shop Settings</h1>

        <form onSubmit={handleSaveSettings} className="space-y-8">
          
          {/* 1. Language Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">🌍 Preferred Language</h2>
            <p className="text-gray-600 mb-4">Select the language for your Telegram bot messages.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    language === lang.code
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{lang.native}</div>
                      <div className="text-xs text-gray-500">{lang.name}</div>
                    </div>
                    {language === lang.code && <span className="ml-auto text-blue-600 font-bold">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Shop Location & Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">📍 Shop Location & Details</h2>
            <p className="text-gray-600 mb-4">Add your shop details so customers can find you by Block/District.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Full Address</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="e.g., Main Road, Near Temple"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block / Area</label>
                <input
                  type="text"
                  value={shopBlock}
                  onChange={(e) => setShopBlock(e.target.value)}
                  placeholder="e.g., Sector 4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={shopDistrict}
                  onChange={(e) => setShopDistrict(e.target.value)}
                  placeholder="e.g., Khordha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={shopState}
                  onChange={(e) => setShopState(e.target.value)}
                  placeholder="e.g., Odisha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={shopPincode}
                  onChange={(e) => setShopPincode(e.target.value)}
                  placeholder="e.g., 751001"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Bot Username</label>
                <input
                  type="text"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  placeholder="e.g., Maf_bot (without @)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your bot username without @ symbol (e.g., Maf_bot)</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              '💾 Save All Settings'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
