import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Minus, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { date } from '../lib/format';
import { PageHeader, Modal, Spinner, EmptyState, Field } from '../components/ui';

export default function Inventory() {
  const qc = useQueryClient();
  const [adjust, setAdjust] = useState(null); // product being adjusted
  const [logsFor, setLogsFor] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inv-products'],
    queryFn: () => api.get('/products', { params: { limit: 500 } }).then((r) => r.data),
  });
  const products = data?.products || [];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track and adjust stock levels" />

      {isLoading ? <Spinner /> : products.length === 0 ? (
        <EmptyState message="No products to track yet." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">In stock</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const low = p.stock <= p.lowStockThreshold;
                return (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3 text-right font-semibold">{p.stock}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{p.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${low ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {low ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn-ghost px-2 py-1" onClick={() => setAdjust(p)}>Adjust</button>
                        <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" onClick={() => setLogsFor(p)}>
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adjust && (
        <AdjustModal product={adjust} onClose={() => setAdjust(null)}
          onSaved={() => { setAdjust(null); qc.invalidateQueries({ queryKey: ['inv-products'] }); }} />
      )}
      {logsFor && <LogsModal product={logsFor} onClose={() => setLogsFor(null)} />}
    </div>
  );
}

function AdjustModal({ product, onClose, onSaved }) {
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (sign) => {
    setBusy(true);
    try {
      await api.post(`/inventory/${product._id}/adjust`, { change: sign * Number(amount), note });
      toast.success('Stock updated');
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Adjust stock — ${product.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Current stock: <b>{product.stock}</b></p>
        <Field label="Quantity">
          <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. supplier restock" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-danger" disabled={busy} onClick={() => submit(-1)}>
            <Minus className="h-4 w-4" /> Remove
          </button>
          <button className="btn-primary" disabled={busy} onClick={() => submit(1)}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </Modal>
  );
}

function LogsModal({ product, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['inv-logs', product._id],
    queryFn: () => api.get('/inventory/logs', { params: { product: product._id } }).then((r) => r.data),
  });
  const logs = data?.logs || [];

  return (
    <Modal open onClose={onClose} title={`History — ${product.name}`}>
      {isLoading ? <Spinner /> : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No history yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((l) => (
            <div key={l._id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="capitalize text-slate-700">{l.reason.replace('_', ' ')}</span>
                {l.note && <span className="text-slate-400"> · {l.note}</span>}
                <div className="text-xs text-slate-400">{date(l.createdAt)} · {l.user?.name || 'system'}</div>
              </div>
              <div className="text-right">
                <span className={l.change > 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                  {l.change > 0 ? '+' : ''}{l.change}
                </span>
                <div className="text-xs text-slate-400">→ {l.stockAfter}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
