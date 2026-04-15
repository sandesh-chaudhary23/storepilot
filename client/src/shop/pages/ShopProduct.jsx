import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner } from '../../components/ui';
import { useCart } from '../CartContext';

export default function ShopProduct() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shop-product', slug, id],
    queryFn: () => api.get(`/shop/${slug}/products/${id}`).then((r) => r.data.product),
    retry: false,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) return <p className="text-slate-500">Product not found. <Link className="text-brand-600" to={`/shop/${slug}`}>Back to shop</Link></p>;

  const out = data.stock <= 0;

  return (
    <div>
      <Link to={`/shop/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
          {data.image ? (
            <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-slate-300"><ShoppingCart className="h-16 w-16" /></div>
          )}
        </div>
        <div>
          {data.category && <div className="text-sm text-brand-600">{data.category.name}</div>}
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{data.name}</h1>
          <div className="mt-2 text-2xl font-bold text-slate-900">{money(data.price)}</div>
          <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{data.description || 'No description.'}</p>

          {data.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.tags.map((t) => <span key={t} className="badge bg-slate-100 text-slate-600">{t}</span>)}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button className="p-2 text-slate-500 disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button className="p-2 text-slate-500 disabled:opacity-30" disabled={qty >= data.stock} onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></button>
            </div>
            <button className="btn-primary flex-1 disabled:opacity-40" disabled={out}
              onClick={() => { add(data, qty); toast.success('Added to cart'); navigate(`/shop/${slug}/cart`); }}>
              <ShoppingCart className="h-4 w-4" /> {out ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {out ? 'Out of stock' : `${data.stock} in stock`}
          </div>
        </div>
      </div>
    </div>
  );
}
