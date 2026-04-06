import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { money, date, statusColors } from '../lib/format';
import { PageHeader, Modal, Spinner, EmptyState, Field } from '../components/ui';

const empty = { name: '', email: '', phone: '', address: '', notes: '' };

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/customers', { params: { search } }).then((r) => r.data),
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deleted'); },
    onError: (e) => toast.error(e.message),
  });

  const customers = data?.customers || [];

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`}
        action={<button className="btn-primary" onClick={() => setModal({ ...empty })}><Plus className="h-4 w-4" /> Add Customer</button>} />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <Spinner /> : customers.length === 0 ? (
        <EmptyState message="No customers yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={c._id} className="card p-4">
              <div className="flex items-start justify-between">
                <button className="text-left" onClick={() => setDetail(c._id)}>
                  <div className="font-semibold text-slate-800 hover:text-brand-600">{c.name}</div>
                  <div className="text-sm text-slate-500">{c.email || '—'}</div>
                  <div className="text-sm text-slate-400">{c.phone}</div>
                </button>
                <div className="flex gap-1">
                  <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" onClick={() => setModal(c)}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => confirm(`Delete ${c.name}?`) && del.mutate(c._id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <CustomerModal customer={modal} onClose={() => setModal(null)}
        onSaved={() => { setModal(null); qc.invalidateQueries({ queryKey: ['customers'] }); }} />}
      {detail && <CustomerDetail id={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = Boolean(customer._id);
  const [form, setForm] = useState(customer);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) await api.put(`/customers/${form._id}`, form);
      else await api.post('/customers', form);
      toast.success(isEdit ? 'Customer updated' : 'Customer added');
      onSaved();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
        </div>
        <Field label="Address"><input className="input" value={form.address} onChange={set('address')} /></Field>
        <Field label="Notes"><textarea className="input" value={form.notes} onChange={set('notes')} /></Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

function CustomerDetail({ id, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then((r) => r.data),
  });

  return (
    <Modal open onClose={onClose} title="Customer details">
      {isLoading ? <Spinner /> : (
        <div className="space-y-4">
          <div>
            <div className="text-lg font-semibold text-slate-800">{data.customer.name}</div>
            <div className="text-sm text-slate-500">{data.customer.email} · {data.customer.phone}</div>
            {data.customer.address && <div className="text-sm text-slate-400">{data.customer.address}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <div className="text-xs uppercase text-slate-400">Orders</div>
              <div className="text-xl font-bold">{data.stats.orderCount}</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-xs uppercase text-slate-400">Total spent</div>
              <div className="text-xl font-bold">{money(data.stats.totalSpent)}</div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-600">Purchase history</h4>
            {data.orders.length === 0 ? (
              <p className="text-sm text-slate-400">No orders yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.orders.map((o) => (
                  <div key={o._id} className="flex items-center justify-between py-2 text-sm">
                    <span>{o.orderNumber} <span className="text-slate-400">· {date(o.createdAt)}</span></span>
                    <span className="flex items-center gap-2">
                      <span className={`badge ${statusColors[o.status]}`}>{o.status}</span>
                      {money(o.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
