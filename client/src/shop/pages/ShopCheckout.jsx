import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner } from '../../components/ui';
import { useCart } from '../CartContext';
import { useShopMe } from '../useShop';

export default function ShopCheckout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { customer, isLoading } = useShopMe(slug);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);
  const base = `/shop/${slug}`;

  if (isLoading) return <Spinner />;

  // Must be signed in to check out.
  if (!customer) {
    return (
      <div className="mx-auto max-w-md text-center">
        <Lock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">Sign in to check out</h1>
        <p className="mt-1 text-sm text-slate-500">You need an account to place an order.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link to={`${base}/login?redirect=checkout`} className="btn-primary">Sign in</Link>
          <Link to={`${base}/register?redirect=checkout`} className="btn-ghost">Create account</Link>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-500" />
        <h1 className="text-2xl font-bold text-slate-800">Order placed!</h1>
        <p className="mt-1 text-slate-500">Your order <b>{placed.orderNumber}</b> for {money(placed.total)} is confirmed.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to={`${base}/orders`} className="btn-primary">View my orders</Link>
          <Link to={base} className="btn-ghost">Keep shopping</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-slate-500">
        Your cart is empty. <Link to={base} className="text-brand-600">Go shopping</Link>
      </div>
    );
  }

  const placeOrder = async () => {
    setBusy(true);
    try {
      const payload = { items: items.map((i) => ({ product: i.product, quantity: i.quantity })) };
      const res = await api.post(`/shop/${slug}/orders`, payload);
      clear();
      setPlaced(res.data.order);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-2 font-semibold text-slate-800">Delivering to</h2>
            <div className="text-sm text-slate-600">
              <div className="font-medium">{customer.name}</div>
              <div>{customer.email}</div>
              {customer.phone && <div>{customer.phone}</div>}
              {customer.address && <div>{customer.address}</div>}
            </div>
            <Link to={`${base}/account`} className="mt-2 inline-block text-sm text-brand-600 hover:underline">Edit details</Link>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Items</h2>
            <div className="divide-y divide-slate-100">
              {items.map((i) => (
                <div key={i.product} className="flex justify-between py-2 text-sm">
                  <span>{i.name} <span className="text-slate-400">× {i.quantity}</span></span>
                  <span>{money(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Summary</h2>
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(subtotal)}</span></div>
          <button className="btn-primary mt-4 w-full" disabled={busy} onClick={placeOrder}>
            {busy ? 'Placing…' : 'Place order'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">Demo checkout — no payment is taken.</p>
        </div>
      </div>
    </div>
  );
}
