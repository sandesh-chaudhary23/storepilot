import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import { ShopRoot } from './shop/ShopLayout';
import ShopHome from './shop/pages/ShopHome';
import ShopProduct from './shop/pages/ShopProduct';
import ShopCart from './shop/pages/ShopCart';
import ShopCheckout from './shop/pages/ShopCheckout';
import ShopLogin from './shop/pages/ShopLogin';
import ShopRegister from './shop/pages/ShopRegister';
import ShopOrders from './shop/pages/ShopOrders';
import ShopAccount from './shop/pages/ShopAccount';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Public storefront — customer-facing, per store slug */}
      <Route path="/shop/:slug" element={<ShopRoot />}>
        <Route index element={<ShopHome />} />
        <Route path="product/:id" element={<ShopProduct />} />
        <Route path="cart" element={<ShopCart />} />
        <Route path="checkout" element={<ShopCheckout />} />
        <Route path="login" element={<ShopLogin />} />
        <Route path="register" element={<ShopRegister />} />
        <Route path="orders" element={<ShopOrders />} />
        <Route path="account" element={<ShopAccount />} />
      </Route>

      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/reset-password/:token" element={<PublicOnly><ResetPassword /></PublicOnly>} />

      <Route path="/" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
