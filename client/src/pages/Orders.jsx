import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { money, date, statusColors } from '../lib/format';
import { PageHeader, Modal, Spinner, EmptyState, Field } from '../components/ui';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [create, setCreate] = useState(false);
  const [detail, setDetail] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => api.get('/orders', { params: { status: filter } }).then((r) => r.data),
  });
  const orders = data?.orders || [];

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders`}
        action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus className="h-4 w-4" /> New Order</button>} />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={filter === ''} onClick={() => setFilter('')}>All</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s}</FilterChip>
        ))}
      </div>

      {isLoading ? <Spinner /> : orders.length === 0 ? (
        <EmptyState message="No orders yet. Create your first order." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o._id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(o._id)}>
                  <td className="px-4 py-3 font-medium text-brand-600">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{o.customer?.name || 'Walk-in'}</td>
                  <td className="px-4 py-3 text-slate-500">{date(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(o.total)}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[o.status]}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {create && <CreateOrderModal onClose={() => setCreate(false)}
        onSaved={() => { setCreate(false); qc.invalidateQueries({ queryKey: ['orders'] }); }} />}
      {detail && <OrderDetail id={detail} onClose={() => setDetail(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ['orders'] })} />}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
        active ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}>
      {children}
    </button>
  );
}

function CreateOrderModal({ onClose, onSaved }) {
  const [customer, setCustomer] = useState('');
  const [tax, setTax] = useState(0);
  const [lines, setLines] = useState([{ product: '', quantity: 1 }]);
  const [busy, setBusy] = useState(false);

  const { data: prodData } = useQuery({ queryKey: ['order-products'], queryFn: () => api.get('/products', { params: { limit: 500 } }).then((r) => r.data) });
  const { data: custData } = useQuery({ queryKey: ['order-customers'], queryFn: () => api.get('/customers').then((r) => r.data) });
  const products = prodData?.products || [];
  const customers = custData?.customers || [];

  const setLine = (i, patch) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines([...lines, { product: '', quantity: 1 }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const priceOf = (id) => products.find((p) => p._id === id)?.price || 0;
  const subtotal = lines.reduce((s, l) => s + priceOf(l.product) * Number(l.quantity || 0), 0);
  const total = subtotal + Number(tax || 0);

  const save = async (e) => {
    e.preventDefault();
    const items = lines.filter((l) => l.product && l.quantity > 0);
    if (items.length === 0) return toast.error('Add at least one product');
    setBusy(true);
    try {
      await api.post('/orders', { customer: customer || undefined, items, tax: Number(tax) });
      toast.success('Order created — stock updated');
      onSaved();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="New Order">
      <form onSubmit={save} className="space-y-4">
        <Field label="Customer (optional)">
          <select className="input" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">Walk-in customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>

        <div>
          <label className="label">Items</label>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const p = products.find((pr) => pr._id === l.product);
              return (
                <div key={i} className="flex items-center gap-2">
                  <select className="input flex-1" value={l.product} onChange={(e) => setLine(i, { product: e.target.value })}>
                    <option value="">Select product…</option>
                    {products.map((pr) => (
                      <option key={pr._id} value={pr._id} disabled={pr.stock === 0}>
                        {pr.name} — {money(pr.price)} ({pr.stock} in stock)
                      </option>
                    ))}
                  </select>
                  <input className="input w-20" type="number" min="1" max={p?.stock || undefined}
                    value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                  <button type="button" className="rounded p-2 text-slate-400 hover:text-red-600"
                    onClick={() => removeLine(i)} disabled={lines.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" className="mt-2 text-sm text-brand-600 hover:underline" onClick={addLine}>+ Add item</button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Field label="Tax"><input className="input w-28" type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
          <div className="text-right">
            <div className="text-sm text-slate-500">Subtotal: {money(subtotal)}</div>
            <div className="text-lg font-bold">Total: {money(total)}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Order'}</button>
        </div>
      </form>
    </Modal>
  );
}

function OrderDetail({ id, onClose, onChanged }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['order', id], queryFn: () => api.get(`/orders/${id}`).then((r) => r.data) });

  const updateStatus = useMutation({
    mutationFn: (status) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['order', id] }); onChanged(); toast.success('Status updated'); },
    onError: (e) => toast.error(e.message),
  });

  const o = data?.order;

  return (
    <Modal open onClose={onClose} title={o ? o.orderNumber : 'Order'}>
      {isLoading || !o ? <Spinner /> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-700">{o.customer?.name || 'Walk-in customer'}</div>
              <div className="text-sm text-slate-400">{date(o.createdAt)}</div>
            </div>
            <span className={`badge ${statusColors[o.status]}`}>{o.status}</span>
          </div>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {o.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{it.name} <span className="text-slate-400">× {it.quantity}</span></span>
                <span>{money(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <Row label="Subtotal" value={money(o.subtotal)} />
            <Row label="Tax" value={money(o.tax)} />
            <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
              <span>Total</span><span>{money(o.total)}</span>
            </div>
          </div>

          {o.status !== 'cancelled' && o.status !== 'delivered' && (
            <div>
              <label className="label">Update status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} disabled={s === o.status || updateStatus.isPending}
                    onClick={() => updateStatus.mutate(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      s === 'cancelled' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600'
                    } disabled:opacity-40`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between text-slate-500"><span>{label}</span><span>{value}</span></div>;
}
