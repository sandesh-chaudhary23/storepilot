import { Link, useParams } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { money } from '../../lib/format';
import { EmptyState } from '../../components/ui';
import { useCart } from '../CartContext';

export default function ShopCart() {
  const { slug } = useParams();
  const { items, setQty, remove, subtotal } = useCart();
  const base = `/shop/${slug}`;

  if (items.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Your cart</h1>
        <EmptyState message="Your cart is empty." />
        <div className="mt-4 text-center">
          <Link to={base} className="btn-primary">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Your cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((i) => (
            <div key={i.product} className="card flex items-center gap-4 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" />
                  : <div className="grid h-full place-items-center text-slate-300"><ShoppingCart className="h-6 w-6" /></div>}
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-800">{i.name}</div>
                <div className="text-sm text-slate-500">{money(i.price)}</div>
              </div>
              <div className="flex items-center rounded-lg border border-slate-300">
                <button className="p-1.5 text-slate-500" onClick={() => setQty(i.product, i.quantity - 1)}><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-8 text-center text-sm">{i.quantity}</span>
                <button className="p-1.5 text-slate-500 disabled:opacity-30" disabled={i.quantity >= i.stock} onClick={() => setQty(i.product, i.quantity + 1)}><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="w-20 text-right font-semibold">{money(i.price * i.quantity)}</div>
              <button className="p-2 text-slate-400 hover:text-red-600" onClick={() => remove(i.product)}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Order summary</h2>
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="mt-1 flex justify-between text-sm text-slate-400"><span>Shipping</span><span>Calculated at checkout</span></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(subtotal)}</span></div>
          <Link to={`${base}/checkout`} className="btn-primary mt-4 w-full">Checkout</Link>
          <Link to={base} className="mt-2 block text-center text-sm text-brand-600 hover:underline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
