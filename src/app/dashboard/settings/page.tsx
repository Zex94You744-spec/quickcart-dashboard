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
  const [language, setLanguage] = useState('hindi');

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
    }
    setLoading(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    const { error } = await supabase
      .from('leads')
      .update({ preferred_language: language })
      .eq('email', user.email);
    
    if (!error) {
      alert('Settings saved successfully!');
    } else {
      alert('Failed to save settings');
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2">← Back to Dashboard</button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Shop Settings</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🌍 Preferred Language</h2>
          <p className="text-gray-600 mb-4">Select the language for your Telegram bot messages.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  language === lang.code
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{lang.native}</div>
                    <div className="text-sm text-gray-500">{lang.name}</div>
                  </div>
                  {language === lang.code && (
                    <span className="ml-auto text-blue-600 font-bold">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
