import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './Login';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', businessName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell title="Create your account" subtitle="Start managing your store">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Your name</label>
          <input className="input" value={form.name} onChange={set('name')} required /></div>
        <div><label className="label">Business name</label>
          <input className="input" value={form.businessName} onChange={set('businessName')} placeholder="Optional" /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} minLength={6} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create Account'}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
