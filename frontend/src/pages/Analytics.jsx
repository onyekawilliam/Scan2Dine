import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import api from '../utils/api';
import { downloadCsv } from '../utils/csv';
import { money, errorMessage } from '../utils/format';
import { ORDER_STATUS } from '../constants/orderStatus';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/toastContext';

// Same meaning as the status badges: amber waiting, blue accepted, indigo in progress, green ready.
const STATUS_COLORS = {
  pending: '#f59e0b', accepted: '#3b82f6', preparing: '#6366f1', ready: '#10b981', completed: '#94a3b8', cancelled: '#ef4444',
};

function Stat({ label, value, hint }) {
  return (
    <div className="card card-pad">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Analytics() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        toast.error(errorMessage(err, 'Could not load analytics.'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Loading analytics…</p>;

  const hasOrders = (stats?.total_orders || 0) > 0 || Object.keys(stats?.orders_by_status || {}).length > 0;

  // Real revenue and order counts for the last 7 days (days are in UTC).
  const revenueData = (stats?.daily || []).map((d) => ({
    name: new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
    revenue: d.revenue,
    orders: d.orders,
  }));

  const pieData = Object.entries(stats?.orders_by_status || {}).map(([key, value]) => ({
    key,
    name: ORDER_STATUS[key]?.label || key,
    value,
  }));

  const exportDailyCsv = () =>
    downloadCsv(
      'daily-sales-last-7-days.csv',
      ['Date (UTC)', 'Orders', 'Revenue'],
      (stats?.daily || []).map((d) => [d.date, d.orders, d.revenue.toFixed(2)])
    );

  const averageOrder = stats?.total_orders ? stats.total_revenue / stats.total_orders : 0;

  return (
    <div>
      <PageHeader title="Analytics" description="How your restaurant is doing. Cancelled orders are not counted as sales.">
        <button type="button" onClick={exportDailyCsv} disabled={!hasOrders} className="btn btn-secondary">
          <Download size={16} /> Export last 7 days
        </button>
      </PageHeader>

      {!hasOrders ? (
        <div className="card">
          <EmptyState icon={BarChart3} title="No sales yet" description="Your numbers appear here after your first orders. Share your QR code to get started.">
            <Link to="/dashboard/qr" className="btn btn-primary">Get your QR code</Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total revenue" value={money(stats.total_revenue)} hint="All time" />
            <Stat label="Orders" value={stats.total_orders} hint="All time" />
            <Stat label="Average order" value={money(averageOrder)} />
            <Stat label="Items on menu" value={stats.menu_items_count} hint="Available to order" />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <section className="card card-pad lg:col-span-2" aria-labelledby="rev-h">
              <h2 id="rev-h" className="card-title">Revenue, last 7 days</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} interval={0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v}`} allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name) => (name === 'revenue' ? [money(value), 'Revenue'] : [value, 'Orders'])}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="#4f46e5" fillOpacity={0.08} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card card-pad" aria-labelledby="dist-h">
              <h2 id="dist-h" className="card-title">Orders by status</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none" isAnimationActive={false}>
                      {pieData.map((entry) => <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="card overflow-hidden" aria-labelledby="top-h">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 id="top-h" className="card-title">Best sellers</h2>
            </div>
            {stats.popular_items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3 text-right">Sold</th>
                      <th className="px-5 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.popular_items.map((item, idx) => (
                      <tr key={item._id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 tabular-nums text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{item._id}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{item.ordersCount}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-900">{money(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">No completed sales yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Analytics;
