import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Sparkles, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { PageHeader, Modal, Spinner, EmptyState, Field } from '../components/ui';

const empty = {
  name: '', sku: '', price: '', cost: '', stock: '', lowStockThreshold: 5,
  category: '', description: '', tags: '',
};

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | {mode, product}

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: { search } }).then((r) => r.data),
  });
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted'); },
    onError: (e) => toast.error(e.message),
  });

  const products = data?.products || [];
  const categories = catData?.categories || [];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${data?.total ?? 0} products`}
        action={
          <button className="btn-primary" onClick={() => setModal({ mode: 'create', product: { ...empty } })}>
            <Plus className="h-4 w-4" /> Add Product
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or SKU…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Spinner /> : products.length === 0 ? (
        <EmptyState message="No products yet. Add your first product to get started." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">{money(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`badge ${p.stock <= p.lowStockThreshold ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        onClick={() => setModal({ mode: 'edit', product: toForm(p) })}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => confirm(`Delete "${p.name}"?`) && del.mutate(p._id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ProductModal
          modal={modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}
    </div>
  );
}

function toForm(p) {
  return {
    _id: p._id, name: p.name, sku: p.sku, price: p.price, cost: p.cost,
    stock: p.stock, lowStockThreshold: p.lowStockThreshold,
    category: p.category?._id || '', description: p.description || '',
    tags: (p.tags || []).join(', '),
  };
}

function ProductModal({ modal, categories, onClose, onSaved }) {
  const isEdit = modal.mode === 'edit';
  const [form, setForm] = useState(modal.product);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const generate = async () => {
    if (!form.name) return toast.error('Enter a product name first');
    setAiBusy(true);
    try {
      const catName = categories.find((c) => c._id === form.category)?.name;
      const res = await api.post('/ai/product-content', { name: form.name, category: catName });
      setForm((f) => ({ ...f, description: res.data.description, tags: res.data.tags.join(', ') }));
      toast.success(res.data._mock ? 'Generated (mock — add GEMINI_API_KEY for real AI)' : 'AI content generated');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, category: form.category || undefined };
      if (isEdit) await api.put(`/products/${form._id}`, payload);
      else await api.post('/products', payload);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
          <Field label="SKU"><input className="input" value={form.sku} onChange={set('sku')} required /></Field>
          <Field label="Price"><input className="input" type="number" step="0.01" value={form.price} onChange={set('price')} required /></Field>
          <Field label="Cost"><input className="input" type="number" step="0.01" value={form.cost} onChange={set('cost')} /></Field>
          {!isEdit && (
            <Field label="Initial stock"><input className="input" type="number" value={form.stock} onChange={set('stock')} /></Field>
          )}
          <Field label="Low-stock threshold"><input className="input" type="number" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label={
          <span className="flex items-center justify-between">
            <span>Description</span>
            <button type="button" onClick={generate} disabled={aiBusy}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" /> {aiBusy ? 'Generating…' : 'AI generate'}
            </button>
          </span>
        }>
          <textarea className="input min-h-[90px]" value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Tags (comma separated)">
          <input className="input" value={form.tags} onChange={set('tags')} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Product'}</button>
        </div>
      </form>
    </Modal>
  );
}
