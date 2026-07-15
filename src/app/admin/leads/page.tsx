'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const PRICING: Record<string, { regular: number; discounted: number }> = {
  starter: { regular: 499, discounted: 249 },
  pro: { regular: 999, discounted: 499 },
  premium: { regular: 1999, discounted: 999 }
};

interface Lead {
  id: string;
  name: string;
  shop_name: string;
  phone: string;
  email: string;
  status: string;
  subscription_plan: string;
  subscription_status: string;
  discount_applied: boolean;
  trial_start_date: string;
  trial_end_date: string;
  discount_start_date: string;
  discount_end_date: string;
  regular_price_start_date: string;
  created_at: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchData();
    
    // Check for payment success in URL (Safe method without Next.js Suspense issues)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment_success') === 'true') {
        setTimeout(() => {
          alert('✅ Payment Successful! Lead ka status update ho gaya hai.');
          // Clean the URL
          window.history.replaceState({}, document.title, '/admin/leads');
          // Refresh data to show updated status          fetchData();
        }, 1000);
      }
    }
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setLeads(data);
      calculateStats(data);
    }
    setLoading(false);
  }

  function calculateStats(data: Lead[]) {
    const stats = {
      total: data.length,
      trial: data.filter(l => l.subscription_status === 'trial').length,
      discounted: data.filter(l => l.subscription_status === 'discounted').length,
      active: data.filter(l => l.subscription_status === 'active').length,
      monthlyRevenue: data.reduce((sum, l) => {
        if (l.subscription_status === 'discounted') {
          return sum + (PRICING[l.subscription_plan || 'pro'].discounted);
        } else if (l.subscription_status === 'active') {
          return sum + (PRICING[l.subscription_plan || 'pro'].regular);
        }
        return sum;
      }, 0)
    };
    setStats(stats);
  }

  async function updateStatus(leadId: string, newStatus: string) {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (!error) {
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    }
  }
  async function handleSendPaymentLink(lead: Lead) {
    const plan = lead.subscription_plan || 'pro';
    const price = lead.subscription_status === 'discounted' 
      ? PRICING[plan]?.discounted || 499
      : PRICING[plan]?.regular || 999;
    
    if (!confirm(`Generate payment page for ${lead.name} for Rs.${price}?`)) return;
    
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          plan: plan
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Direct browser mein naye tab mein payment page open karo
        window.open(result.paymentUrl, '_blank');
        // alert(`✅ Payment page open ho gaya hai!\nAmount: Rs.${result.amount}`);
      } else {
        alert('❌ Error: ' + (result.error || 'Failed to create payment link'));
      }
    } catch (error) {
      console.error('Payment link error:', error);
      alert('❌ Failed to generate payment link.');
    }
  }

  async function runSubscriptionCheck() {
    if (!confirm('Saari subscriptions check aur update karna hai?')) return;
    
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_and_update' })
    });
    
    const result = await response.json();
    if (result.success) {
      alert(`✅ ${result.updated} subscriptions update ho gayi!`);
      fetchData();
    }
  }

  function getSubscriptionBadge(lead: Lead) {    const now = new Date();
    const plan = lead.subscription_plan || 'pro';
    
    if (lead.subscription_status === 'trial') {
      const trialEnd = new Date(lead.trial_end_date);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <div>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
            TRIAL
          </span>
          <div className="text-xs text-gray-600 mt-1">
            {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
          </div>
        </div>
      );
    } else if (lead.subscription_status === 'discounted') {
      const discountEnd = new Date(lead.discount_end_date);
      const daysLeft = Math.ceil((discountEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const price = PRICING[plan].discounted;
      return (
        <div>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
            50% OFF
          </span>
          <div className="text-xs text-gray-600 mt-1">
            Rs.{price}/mo • {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
          </div>
        </div>
      );
    } else if (lead.subscription_status === 'active') {
      const price = PRICING[plan].regular;
      return (
        <div>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
            ACTIVE
          </span>
          <div className="text-xs text-gray-600 mt-1">
            Rs.{price}/mo
          </div>
        </div>
      );
    }
    return <span className="text-gray-500">—</span>;
  }

  function exportToCSV() {
    const headers = ['Name', 'Shop', 'Phone', 'Email', 'Status', 'Plan', 'Subscription', 'Price', 'Trial End', 'Discount End'];
    const rows = leads.map(lead => {
      const plan = lead.subscription_plan || 'pro';      let price = 0;
      if (lead.subscription_status === 'discounted') price = PRICING[plan].discounted;
      else if (lead.subscription_status === 'active') price = PRICING[plan].regular;
      
      return [
        lead.name,
        lead.shop_name,
        lead.phone,
        lead.email,
        lead.status,
        plan,
        lead.subscription_status,
        price,
        new Date(lead.trial_end_date).toLocaleDateString('en-IN'),
        lead.discount_end_date ? new Date(lead.discount_end_date).toLocaleDateString('en-IN') : 'N/A'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filteredLeads = filter === 'all' ? leads : 
    filter === 'trial' ? leads.filter(l => l.subscription_status === 'trial') :
    filter === 'discounted' ? leads.filter(l => l.subscription_status === 'discounted') :
    filter === 'active' ? leads.filter(l => l.subscription_status === 'active') :
    leads;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage leads, trials & subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={runSubscriptionCheck}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"            >
              🔄 Update Subscriptions
            </button>
            <button 
              onClick={exportToCSV}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              📊 Export CSV
            </button>
            <a 
              href="/landing"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🏠 Home
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Leads</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">On Trial</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.trial}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">50% Discount</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.discounted}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Active Paid</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{stats.active}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="text-sm">Monthly Revenue</div>
            <div className="text-3xl font-bold mt-2">₹{stats.monthlyRevenue || 0}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'trial', label: 'Trial' },
              { key: 'discounted', label: 'Discounted' },
              { key: 'active', label: 'Active' }            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Leads</h2>
          </div>
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No leads found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {lead.name}
                        <div className="text-xs text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lead.shop_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline block">{lead.phone}</a>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={lead.subscription_plan || 'pro'}
                          onChange={(e) => {
                            supabase.from('leads').update({ subscription_plan: e.target.value }).eq('id', lead.id);
                            setLeads(leads.map(l => l.id === lead.id ? {...l, subscription_plan: e.target.value} : l));                          }}
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="starter">Starter (₹499)</option>
                          <option value="pro">Pro (₹999)</option>
                          <option value="premium">Premium (₹1999)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getSubscriptionBadge(lead)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm space-y-2">
                        <button
                          onClick={() => handleSendPaymentLink(lead)}
                          className="text-blue-600 hover:text-blue-900 font-semibold block"
                        >
                          💳 Send Payment
                        </button>
                        <a 
                          href={`https://wa.me/91${lead.phone}`}
                          target="_blank"
                          className="text-green-600 hover:underline block"
                        >
                          💬 WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
