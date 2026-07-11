'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, []);

  async function fetchOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (data) {
      setOrder(data);
      setLoading(false);
    }
  }

  const getStatusStep = (status: string) => {
    switch(status) {
      case 'pending': return 1;
      case 'accepted': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">📦 Order Tracking</h1>
          <p className="text-gray-600 mt-1">Order ID: {order.id}</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                {currentStep >= 1 ? '✓' : '1'}
              </div>
              <span className="text-xs mt-1">Order Placed</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                {currentStep >= 2 ? '✓' : '2'}
              </div>
              <span className="text-xs mt-1">Accepted</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                {currentStep >= 3 ? '✓' : '3'}
              </div>
              <span className="text-xs mt-1">Delivered</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <span className={`text-lg font-semibold ${currentStep === 3 ? 'text-green-600' : 'text-blue-600'}`}>
              {order.status === 'pending' && ' Order Received'}
              {order.status === 'accepted' && '✅ Order Accepted'}
              {order.status === 'delivered' && '🎉 Order Delivered!'}
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">          <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Order Details</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Items:</span>
              <ul className="list-disc list-inside mt-1">
                {Array.isArray(order.items) ? order.items.map((item, idx) => (
                  <li key={idx} className="text-gray-900">{item}</li>
                )) : <li className="text-gray-900">{order.items}</li>}
              </ul>
            </div>
            <div>
              <span className="text-sm text-gray-600"> Delivery Address:</span>
              <p className="text-gray-900">{order.address}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">📞 Phone:</span>
              <p className="text-gray-900">{order.phone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">🕐 Order Time:</span>
              <p className="text-gray-900">{new Date(order.created_id).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-blue-800">
            {order.status === 'pending' && '⏳ Your order is being processed. We will notify you soon!'}
            {order.status === 'accepted' && '🚚 Your order is being prepared and will be delivered soon!'}
            {order.status === 'delivered' && '✅ Thank you for shopping with us! Hope to see you again!'}
          </p>
        </div>
      </div>
    </div>
  );
}
