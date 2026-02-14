import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/AdminLayout';
import { analyticsAPI } from '@/lib/api';
import axios from 'axios';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const TIME_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'total', label: 'Total' }
];

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [orderStatus, setOrderStatus] = useState({});
  const [profitStats, setProfitStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(30);
  
  // Time period states for each section
  const [revenuePeriod, setRevenuePeriod] = useState('today');
  const [profitPeriod, setProfitPeriod] = useState('today');
  const [visitsPeriod, setVisitsPeriod] = useState('today');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, topRes, chartRes, statusRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getTopProducts(10),
        analyticsAPI.getRevenueChart(chartDays),
        analyticsAPI.getOrderStatus(),
      ]);
      setOverview(overviewRes.data);
      setTopProducts(topRes.data);
      setRevenueChart(chartRes.data);
      setOrderStatus(statusRes.data);
      
      // Fetch profit analytics
      const token = localStorage.getItem('admin_token');
      if (token) {
        const profitRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/analytics/profit`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfitStats(profitRes.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [chartDays]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount) => {
    const rounded = Math.round(amount || 0);
    if (rounded >= 100000) return `Rs ${Math.round(rounded / 100000)}L`;
    if (rounded >= 1000) return `Rs ${Math.round(rounded / 1000)}K`;
    return `Rs ${rounded.toLocaleString()}`;
  };

  const getRevenueData = (period) => {
    if (!overview) return { revenue: 0, orders: 0 };
    switch (period) {
      case 'today': return overview.today || { revenue: 0, orders: 0 };
      case 'week': return overview.week || { revenue: 0, orders: 0 };
      case 'month': return overview.month || { revenue: 0, orders: 0 };
      case 'lastMonth': return overview.lastMonth || { revenue: 0, orders: 0 };
      case 'total': return overview.total || { revenue: 0, orders: 0 };
      default: return { revenue: 0, orders: 0 };
    }
  };

  const getProfitData = (period) => {
    if (!profitStats) return { profit: 0 };
    switch (period) {
      case 'today': return profitStats.today || { profit: 0 };
      case 'week': return profitStats.week || { profit: 0 };
      case 'month': return profitStats.month || { profit: 0 };
      case 'lastMonth': return profitStats.lastMonth || { profit: 0 };
      case 'total': return profitStats.total || { profit: 0 };
      default: return { profit: 0 };
    }
  };

  const getVisitsData = (period) => {
    if (!overview?.visits) return 0;
    switch (period) {
      case 'today': return overview.visits.today || 0;
      case 'week': return overview.visits.week || 0;
      case 'month': return overview.visits.month || 0;
      case 'lastMonth': return overview.visits.lastMonth || 0;
      case 'total': return overview.visits.total || 0;
      default: return 0;
    }
  };

  const getPeriodLabel = (period) => {
    return TIME_PERIODS.find(p => p.value === period)?.label || 'Today';
  };

  if (loading && !overview) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      </AdminLayout>
    );
  }

  const revenueData = getRevenueData(revenuePeriod);
  const profitData = getProfitData(profitPeriod);
  const visitsData = getVisitsData(visitsPeriod);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <select
            value={chartDays}
            onChange={(e) => setChartDays(Number(e.target.value))}
            className="bg-zinc-800 border-zinc-700 text-white rounded-md px-3 py-2"
            data-testid="chart-days-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Revenue Stats - Single Card with Period Selector */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-gray-400 text-sm">Revenue</p>
                  <TimePeriodSelector 
                    value={revenuePeriod} 
                    onChange={setRevenuePeriod}
                    testId="revenue-period-select"
                  />
                </div>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(revenueData.revenue)}</p>
                <p className="text-gray-500 text-sm mt-1">{revenueData.orders || 0} orders</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Analytics - Single Card with Only Profit */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Profit Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-gray-400 text-sm font-medium">Period</p>
                <TimePeriodSelector 
                  value={profitPeriod} 
                  onChange={setProfitPeriod}
                  testId="profit-period-select"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-lg">Profit:</span>
                <span className={`text-3xl font-bold ${(profitData.profit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  Rs {Math.round(profitData.profit || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4">* Profit = Revenue - Cost Price (set in product variations)</p>
          </CardContent>
        </Card>

        {/* Website Visits Analytics - Single Card with Period Selector */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> Website Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-gray-400 text-sm">Period</p>
                <TimePeriodSelector 
                  value={visitsPeriod} 
                  onChange={setVisitsPeriod}
                  testId="visits-period-select"
                />
              </div>
              <p className="text-3xl font-bold text-white">{visitsData}</p>
              <p className="text-gray-500 text-xs mt-1">unique visitors</p>
            </div>
            <p className="text-gray-500 text-xs mt-4">* Website visit tracking is based on unique page views</p>
          </CardContent>
        </Card>

        {/* Revenue Chart - Full Width */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#666" 
                    tickFormatter={(val) => `Rs ${Math.round(val)}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => [`Rs ${Math.round(value)}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#F5A623" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-amber-500 font-bold w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.quantity} sold</p>
                    </div>
                    <span className="text-green-400 font-semibold">
                      Rs {Math.round(product.revenue || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function TimePeriodSelector({ value, onChange, testId }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-zinc-700 border border-zinc-600 text-white text-sm rounded-lg px-3 py-1.5 pr-8 cursor-pointer hover:bg-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        data-testid={testId}
      >
        {TIME_PERIODS.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
