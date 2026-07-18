'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (data) setOrder(data);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center">Order not found.</div>;

  const statusSteps = ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Order ID: #{orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex-1 text-center">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-white font-bold ${
                  idx <= currentStepIndex ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  {idx <= currentStepIndex ? '✓' : idx + 1}
                </div>
                <p className={`text-xs mt-2 font-medium ${idx <= currentStepIndex ? 'text-green-600' : 'text-gray-400'}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-green-600 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">Items</p>
            <p className="text-lg font-semibold text-gray-900">{order.items}</p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Amount</p>
              <p className="text-lg font-bold text-gray-900">₹{order.amount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Status</p>
              <p className="text-lg font-bold text-green-600">{order.status}</p>
            </div>
          </div>
          {order.delivery_time && (
            <div>
              <p className="text-sm text-gray-500 font-medium">Estimated Delivery</p>
              <p className="text-lg font-semibold text-gray-900">{order.delivery_time}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a href="/landing" className="text-blue-600 hover:text-blue-800 font-medium">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
