import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Field } from '../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.put('/profile', profile);
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/profile/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await api.post('/profile/avatar', fd);
      setUser(res.data.user);
      toast.success('Avatar updated');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name?.[0]?.toUpperCase()}
            </div>
            <label className="btn-ghost cursor-pointer">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Name"><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Role"><input className="input capitalize" value={user.role} disabled /></Field>
            <button className="btn-primary" disabled={busy}>Save changes</button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-slate-800">Change password</h3>
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password"><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></Field>
            <Field label="New password"><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} minLength={6} required /></Field>
            <button className="btn-primary" disabled={busy}>Update password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
