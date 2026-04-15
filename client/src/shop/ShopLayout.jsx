import { Link, Outlet, useParams, NavLink } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, User, Store } from 'lucide-react';
import { CartProvider, useCart } from './CartContext';
import { useStore, useShopMe } from './useShop';
import { Spinner } from '../components/ui';

function Header() {
  const { slug } = useParams();
  const { data: store } = useStore(slug);
  const { customer } = useShopMe(slug);
  const { count } = useCart();
  const base = `/shop/${slug}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to={base} className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <ShoppingBag className="h-6 w-6 text-brand-600" /> {store?.name || 'Store'}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <NavLink to={base} end className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block">
            Shop
          </NavLink>
          {customer && (
            <NavLink to={`${base}/orders`} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block">
              My Orders
            </NavLink>
          )}
          <Link to={`${base}/cart`} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-50">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          {customer ? (
            <Link to={`${base}/account`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <User className="h-4 w-4" /> <span className="hidden sm:inline">{customer.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to={`${base}/login`} className="btn-primary px-3 py-1.5 text-sm">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function ShopLayout() {
  const { slug } = useParams();
  const { data: store, isLoading, isError } = useStore(slug);

  if (isLoading) return <div className="grid h-screen place-items-center"><Spinner label="Loading store…" /></div>;
  if (isError || !store) {
    return (
      <div className="grid h-screen place-items-center p-6 text-center">
        <div>
          <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h1 className="text-lg font-semibold text-slate-700">Store not found</h1>
          <p className="text-sm text-slate-500">The store “{slug}” doesn’t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        {store.name} · powered by StorePilot
      </footer>
    </div>
  );
}

// Wraps ShopLayout with the cart provider (needs the :slug param).
export function ShopRoot() {
  return (
    <CartProvider>
      <ShopLayout />
    </CartProvider>
  );
}
