'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AnalyticsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dateRange, setDateRange] = useState('7'); // 7, 30, 90 days

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) fetchData(email);
    else router.push('/login');
  }, [dateRange]);

  async function fetchData(email: string) {    try {
      const { data: userData } = await supabase.from('leads').select('shop_name').eq('email', email).single();
      if (userData) setUser(userData);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersData) {
        // Filter by date range
        const days = parseInt(dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const filteredOrders = ordersData.filter(order => 
          new Date(order.created_at) >= cutoffDate
        );
        
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading analytics...</div>;

  // Calculate Metrics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const completedRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Revenue by Date (Last X days)
  const revenueByDate: { [key: string]: number } = {};
  orders.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    revenueByDate[date] = (revenueByDate[date] || 0) + (Number(order.amount) || 0);
  });

  const revenueChartData = {
    labels: Object.keys(revenueByDate).reverse(),
    datasets: [      {
        label: 'Revenue (₹)',
        data: Object.values(revenueByDate).reverse(),
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.4,
      },
    ],
  };

  // Orders by Status
  const statusCounts = {
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    'Out for Delivery': orders.filter(o => o.status === 'Out for Delivery').length,
    Confirmed: orders.filter(o => o.status === 'Confirmed' || o.status === 'Completed').length,
    Pending: orders.filter(o => o.status === 'Pending').length,
    Rejected: orders.filter(o => o.status === 'Rejected').length,
  };

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgb(34, 197, 94)',   // Green - Delivered
          'rgb(59, 130, 246)',  // Blue - Out for Delivery
          'rgb(99, 102, 241)',  // Indigo - Confirmed
          'rgb(234, 179, 8)',   // Yellow - Pending
          'rgb(239, 68, 68)',   // Red - Rejected
        ],
        borderWidth: 0,
      },
    ],
  };

  // Top Customers
  const customerRevenue: { [key: string]: number } = {};
  orders.forEach(order => {
    const customer = order.customer_name || 'Unknown';
    customerRevenue[customer] = (customerRevenue[customer] || 0) + (Number(order.amount) || 0);
  });

  const topCustomers = Object.entries(customerRevenue)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  const topCustomersChartData = {
    labels: topCustomers.map(c => c[0]),    datasets: [
      {
        label: 'Revenue (₹)',
        data: topCustomers.map(c => c[1]),
        backgroundColor: 'rgb(59, 130, 246)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics 📊</h1>
            <p className="text-gray-600 mt-1">Track your store performance over time.</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards */}        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalOrders}</p>
            <p className="text-xs text-gray-400 mt-1">In selected period</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Completed Orders</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{completedOrders}</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% completion rate
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">₹{totalRevenue}</p>
            <p className="text-xs text-gray-400 mt-1">₹{completedRevenue} from completed</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Avg Order Value</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">₹{avgOrderValue}</p>
            <p className="text-xs text-gray-400 mt-1">Per order average</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h2>
            <div className="h-64">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h2>
            <div className="h-64">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Customers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Customers</h2>
            <div className="h-64">              <Bar data={topCustomersChartData} options={chartOptions} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Pending Orders</span>
                <span className="font-bold text-yellow-600">{pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Out for Delivery</span>
                <span className="font-bold text-blue-600">{statusCounts['Out for Delivery']}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Rejected Orders</span>
                <span className="font-bold text-red-600">{statusCounts.Rejected}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Completion Rate</span>
                <span className="font-bold text-green-600">
                  {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Revenue per Day</span>
                <span className="font-bold text-blue-600">
                  ₹{Math.round(totalRevenue / parseInt(dateRange))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
