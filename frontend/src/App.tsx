import { lazy, ReactElement, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import AdminLogin from './pages/AdminLogin';
import RequireAuth from './components/Auth/RequireAuth';
import RequirePermission from './components/Auth/RequirePermission';
import AuthLoadingFallback from './components/Auth/AuthLoadingFallback';

const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const PaymentReturn = lazy(() => import('./pages/PaymentReturn'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminOrderDetails = lazy(() => import('./pages/AdminOrderDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminStaff = lazy(() => import('./pages/AdminStaff'));
const AdminMenu = lazy(() => import('./pages/AdminMenu'));
const AdminCustomers = lazy(() => import('./pages/AdminCustomers'));
const AcceptStaffInvite = lazy(() => import('./pages/AcceptStaffInvite'));

const lazyPage = (page: ReactElement) => (
  <Suspense fallback={<AuthLoadingFallback />}>{page}</Suspense>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/oauth/callback" element={lazyPage(<OAuthCallback />)} />
        <Route path="/payment/return" element={lazyPage(<PaymentReturn />)} />
        <Route path="/reset-password" element={lazyPage(<ResetPassword />)} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/invitations/accept"
          element={lazyPage(<AcceptStaffInvite />)}
        />

        <Route element={<RequireAuth />}>
          <Route path="/profile" element={lazyPage(<Profile />)} />
          <Route path="/orders/:orderId" element={lazyPage(<OrderDetails />)} />
        </Route>

        <Route element={<RequirePermission permission="view_orders" />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={lazyPage(<AdminDashboard />)}
          />
          <Route path="/admin/orders" element={lazyPage(<AdminOrders />)} />
          <Route
            path="/admin/orders/:orderId"
            element={lazyPage(<AdminOrderDetails />)}
          />
        </Route>

        <Route element={<RequirePermission permission="manage_menu" />}>
          <Route path="/admin/menu" element={lazyPage(<AdminMenu />)} />
        </Route>

        <Route element={<RequirePermission permission="manage_staff" />}>
          <Route path="/admin/staff" element={lazyPage(<AdminStaff />)} />
        </Route>

        <Route element={<RequirePermission permission="manage_customers" />}>
          <Route
            path="/admin/customers"
            element={lazyPage(<AdminCustomers />)}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
