import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Users, Calendar as CalendarIcon, Download } from 'lucide-react';
import api from '../utils/api';

const COLORS = ['#28a745', '#0088FE', '#FFBB28', '#FF8042'];

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Analytics...</div>;

  // Real revenue and order counts for the last 7 days (days are in UTC).
  const revenueData = (stats?.daily || []).map((d) => ({
    name: new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
    revenue: d.revenue,
    orders: d.orders,
  }));

  const pieData = Object.keys(stats?.orders_by_status || {}).map(key => ({
    name: key,
    value: stats.orders_by_status[key]
  }));

  const MetricCard = ({ title, value, icon: Icon, trend, prefix = '' }) => (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex items-center justify-between group hover:shadow-lg transition-all">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{prefix}{value}</h3>
        {trend && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Date Range */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Analytics Dashboard</h1>
          <p className="text-slate-500">Track your restaurant's performance and revenue.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            <CalendarIcon size={18} /> This Week
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 shadow-md">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue" value={(stats?.total_revenue || 0).toFixed(2)} prefix="$" icon={DollarSign} />
        <MetricCard title="Total Orders" value={stats?.total_orders || 0} icon={ShoppingBag} />
        <MetricCard title="Avg. Order Value" value={((stats?.total_revenue || 0) / (stats?.total_orders || 1)).toFixed(2)} prefix="$" icon={TrendingUp} />
        <MetricCard title="Available Menu Items" value={stats?.menu_items_count || 0} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue, last 7 days</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Order Distribution</h3>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400">No orders data to display</div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Items Table */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Top Selling Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Rank</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Times Ordered</th>
                <th className="p-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.popular_items?.length > 0 ? stats.popular_items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    {idx < 3 ? (
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : 'bg-amber-600'}`}>
                        #{idx + 1}
                      </span>
                    ) : (
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-500 bg-slate-100">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="p-4 font-bold text-slate-800">{item._id}</td>
                  <td className="p-4 text-slate-600 font-medium">{item.ordersCount}x</td>
                  <td className="p-4 font-bold text-green-600">${item.revenue.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">Not enough data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Analytics;
