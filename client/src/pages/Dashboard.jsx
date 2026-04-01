import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, Store, Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { money, date, statusColors } from '../lib/format';
import { PageHeader, Spinner } from '../components/ui';

function StorefrontCard() {
  const { data } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.get('/business').then((r) => r.data.business),
  });
  if (!data?.slug) return null;
  const path = `/shop/${data.slug}`;
  const url = `${window.location.origin}${path}`;
  return (
    <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-brand-100 bg-brand-50/50 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white"><Store className="h-5 w-5" /></div>
        <div>
          <div className="text-sm font-semibold text-slate-800">Your public storefront is live</div>
          <div className="text-xs text-slate-500">{url}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(url); toast.success('Link copied'); }}>
          <Copy className="h-4 w-4" /> Copy
        </button>
        <a className="btn-primary" href={path} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" /> Visit
        </a>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) return <Spinner />;
  const { stats, revenueSeries, statusCounts, lowStockProducts, recentOrders } = data;
  const statusData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your store at a glance" />

      <StorefrontCard />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={DollarSign} label="Revenue" value={money(stats.totalRevenue)} tone="green" />
        <Stat icon={ShoppingCart} label="Orders" value={stats.totalOrders} tone="brand" />
        <Stat icon={Package} label="Products" value={stats.totalProducts} tone="slate" />
        <Stat icon={Users} label="Customers" value={stats.totalCustomers} tone="slate" />
        <Stat icon={AlertTriangle} label="Low Stock" value={stats.lowStockCount} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-800">Revenue — last 7 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" fontSize={12} stroke="#94a3b8" />
              <YAxis fontSize={12} stroke="#94a3b8" />
              <Tooltip formatter={(v) => money(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-4 font-semibold text-slate-800">Orders by status</h3>
          {statusData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={12} allowDecimals={false} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent orders</h3>
            <Link to="/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No orders yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium text-slate-700">{o.orderNumber}</div>
                    <div className="text-xs text-slate-400">{o.customer?.name || 'Walk-in'} · {date(o.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${statusColors[o.status]}`}>{o.status}</span>
                    <span className="font-medium">{money(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Low stock alerts</h3>
            <Link to="/inventory" className="text-sm text-brand-600 hover:underline">Manage</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Everything is well stocked 🎉</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium text-slate-700">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.sku}</div>
                  </div>
                  <span className="badge bg-amber-100 text-amber-700">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
