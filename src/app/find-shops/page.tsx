'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function FindShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchPincode, setSearchPincode] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    const { data, error } = await supabase
      .from('leads')
      .select('shop_name, shop_district, shop_block, shop_state, shop_pincode, shop_address, bot_token')
      .not('shop_district', 'is', null);
    
    if (data) {
      setShops(data);
    }
    setLoading(false);
  }

  const filteredShops = shops.filter(shop => {
    const matchDistrict = searchDistrict === '' || shop.shop_district?.toLowerCase().includes(searchDistrict.toLowerCase());
    const matchPincode = searchPincode === '' || shop.shop_pincode?.includes(searchPincode);
    return matchDistrict && matchPincode;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🛍️ Find Local Shops</h1>
          <p className="text-gray-600">Search shops by District or Pincode and order from home!</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by District</label>
              <input
                type="text"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                placeholder="e.g., Sambalpur, Khordha"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Pincode</label>
              <input
                type="text"
                value={searchPincode}
                onChange={(e) => setSearchPincode(e.target.value)}
                placeholder="e.g., 768001"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading shops...</div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No shops found in your area. Be the first to join!</div>
        ) : (
          <div className="space-y-4">
            {filteredShops.map((shop, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">🏪 {shop.shop_name || 'Local Shop'}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {shop.shop_address && <p>📍 {shop.shop_address}</p>}
                      {shop.shop_block && <p>🏘️ {shop.shop_block}</p>}
                      {shop.shop_district && <p>🏙️ {shop.shop_district}, {shop.shop_state || 'Odisha'}</p>}
                      {shop.shop_pincode && <p>📮 {shop.shop_pincode}</p>}
                    </div>
                  </div>
                  <a 
                    href={`https://t.me/YourBot`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Order Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA for Shop Owners */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">🏪 Own a Shop?</h2>
          <p className="mb-4">Join QuickCart and reach more customers in your area!</p>
          <a href="/signup" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-block">
            Register Your Shop - Free Trial
          </a>
        </div>
      </div>
    </div>
  );
}
