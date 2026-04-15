import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Search, ShoppingCart, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, EmptyState } from '../../components/ui';
import { useCart } from '../CartContext';

export default function ShopHome() {
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { add } = useCart();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-products', slug, search, category],
    queryFn: () =>
      api.get(`/shop/${slug}/products`, { params: { search, category } }).then((r) => r.data),
  });
  const { data: catData } = useQuery({
    queryKey: ['shop-categories', slug],
    queryFn: () => api.get(`/shop/${slug}/categories`).then((r) => r.data),
  });

  const products = data?.products || [];
  const categories = catData?.categories || [];

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 p-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Shop our collection</h1>
        <p className="mt-1 text-brand-100">Quality products, delivered fast.</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <Spinner /> : products.length === 0 ? (
        <EmptyState message="No products found." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} slug={slug} onAdd={() => { add(p); toast.success(`${p.name} added to cart`); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, slug, onAdd }) {
  const out = product.stock <= 0;
  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link to={`/shop/${slug}/product/${product._id}`} className="block aspect-square overflow-hidden bg-slate-100">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-slate-300"><ShoppingCart className="h-10 w-10" /></div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link to={`/shop/${slug}/product/${product._id}`} className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-1 text-xs text-slate-400">{product.category?.name}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold text-slate-900">{money(product.price)}</span>
          <button className="btn-primary px-2.5 py-1.5 text-xs disabled:opacity-40" disabled={out} onClick={onAdd}>
            {out ? 'Sold out' : <><ShoppingCart className="h-3.5 w-3.5" /> Add</>}
          </button>
        </div>
        {!out && product.stock <= product.lowStockThreshold && (
          <div className="mt-1 text-[11px] font-medium text-amber-600">Only {product.stock} left</div>
        )}
      </div>
    </div>
  );
}
