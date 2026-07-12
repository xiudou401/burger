import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
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

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<AuthLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/invitations/accept"
            element={<AcceptStaffInvite />}
          />

          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
          </Route>

          <Route element={<RequirePermission permission="view_orders" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route
              path="/admin/orders/:orderId"
              element={<AdminOrderDetails />}
            />
          </Route>

          <Route element={<RequirePermission permission="manage_menu" />}>
            <Route path="/admin/menu" element={<AdminMenu />} />
          </Route>

          <Route element={<RequirePermission permission="manage_staff" />}>
            <Route path="/admin/staff" element={<AdminStaff />} />
          </Route>

          <Route element={<RequirePermission permission="manage_customers" />}>
            <Route path="/admin/customers" element={<AdminCustomers />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
