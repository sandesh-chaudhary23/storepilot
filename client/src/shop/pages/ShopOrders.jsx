import { useQuery } from '@tanstack/react-query';
import { useParams, Link, Navigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { money, date, statusColors } from '../../lib/format';
import { Spinner, EmptyState } from '../../components/ui';
import { useShopMe } from '../useShop';

export default function ShopOrders() {
  const { slug } = useParams();
  const { customer, isLoading: loadingMe } = useShopMe(slug);

  const { data, isLoading } = useQuery({
    queryKey: ['shop-orders', slug],
    queryFn: () => api.get(`/shop/${slug}/orders`).then((r) => r.data),
    enabled: !!customer,
  });

  if (loadingMe) return <Spinner />;
  if (!customer) return <Navigate to={`/shop/${slug}/login`} replace />;

  const orders = data?.orders || [];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">My orders</h1>
      {isLoading ? <Spinner /> : orders.length === 0 ? (
        <div>
          <EmptyState message="You haven't placed any orders yet." />
          <div className="mt-4 text-center"><Link to={`/shop/${slug}`} className="btn-primary">Start shopping</Link></div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{o.orderNumber}</div>
                  <div className="text-sm text-slate-400">{date(o.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusColors[o.status]}`}>{o.status}</span>
                  <span className="font-bold">{money(o.total)}</span>
                </div>
              </div>
              <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm text-slate-600">
                    <span>{it.name} <span className="text-slate-400">× {it.quantity}</span></span>
                    <span>{money(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
