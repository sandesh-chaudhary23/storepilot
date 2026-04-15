import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useShopActions } from '../useShop';
import { ShopAuthShell } from './ShopLogin';

export default function ShopRegister() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register } = useShopActions(slug);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const base = `/shop/${slug}`;
  const redirect = params.get('redirect');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success('Account created');
      navigate(redirect === 'checkout' ? `${base}/checkout` : base);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ShopAuthShell title="Create your account">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label>
          <input className="input" value={form.name} onChange={set('name')} required /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        <div><label className="label">Phone (optional)</label>
          <input className="input" value={form.phone} onChange={set('phone')} /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} minLength={6} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account? <Link to={`${base}/login${redirect ? `?redirect=${redirect}` : ''}`} className="text-brand-600 hover:underline">Sign in</Link>
      </p>
    </ShopAuthShell>
  );
}
