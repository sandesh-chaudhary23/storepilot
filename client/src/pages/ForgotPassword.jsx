import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If that email exists, a reset link was sent.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link">
      {sent ? (
        <div className="text-center text-sm text-slate-600">
          <p>Check your inbox for a reset link (valid 30 minutes).</p>
          <p className="mt-2 text-xs text-slate-400">
            No SMTP configured? The server logs an Ethereal preview URL to the console.
          </p>
          <Link to="/login" className="mt-4 inline-block text-brand-600 hover:underline">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send Reset Link'}</button>
          <Link to="/login" className="block text-center text-sm text-brand-600 hover:underline">Back to sign in</Link>
        </form>
      )}
    </AuthShell>
  );
}
