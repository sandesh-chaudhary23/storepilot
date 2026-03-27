import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './Login';

export default function ResetPassword() {
  const { token } = useParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setUser(res.data.user);
      toast.success('Password reset — you are signed in.');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">New password</label>
          <input className="input" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} minLength={6} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Reset Password'}</button>
      </form>
    </AuthShell>
  );
}
