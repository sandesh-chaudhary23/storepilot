import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useShopActions } from '../useShop';

export default function ShopLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useShopActions(slug);
  const [form, setForm] = useState({ email: 'shopper@storepilot.app', password: 'password123' });
  const [busy, setBusy] = useState(false);
  const base = `/shop/${slug}`;
  const redirect = params.get('redirect');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Signed in');
      navigate(redirect === 'checkout' ? `${base}/checkout` : base);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ShopAuthShell title="Sign in">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        New here? <Link to={`${base}/register${redirect ? `?redirect=${redirect}` : ''}`} className="text-brand-600 hover:underline">Create an account</Link>
      </p>
    </ShopAuthShell>
  );
}

export function ShopAuthShell({ title, children }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white"><ShoppingBag className="h-6 w-6" /></div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
