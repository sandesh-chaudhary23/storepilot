import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui';
import { useShopMe, useShopActions } from '../useShop';

export default function ShopAccount() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { customer, isLoading } = useShopMe(slug);
  const { logout } = useShopActions(slug);
  const base = `/shop/${slug}`;

  if (isLoading) return <Spinner />;
  if (!customer) return <Navigate to={`${base}/login`} replace />;

  const doLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate(base);
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">My account</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {customer.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{customer.name}</div>
            <div className="text-sm text-slate-500">{customer.email}</div>
            {customer.phone && <div className="text-sm text-slate-400">{customer.phone}</div>}
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <Link to={`${base}/orders`} className="btn-ghost w-full justify-start"><Package className="h-4 w-4" /> My orders</Link>
          <button onClick={doLogout} className="btn-ghost w-full justify-start text-red-600"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </div>
    </div>
  );
}
