import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import OAuthCallback from './pages/OAuthCallback';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import OrderDetails from './pages/OrderDetails';
import AdminOrders from './pages/AdminOrders';
import AdminOrderDetails from './pages/AdminOrderDetails';
import AdminLogin from './pages/AdminLogin';
import AdminStaff from './pages/AdminStaff';
import AdminMenu from './pages/AdminMenu';
import AdminCustomers from './pages/AdminCustomers';
import AcceptStaffInvite from './pages/AcceptStaffInvite';
import RequireAuth from './components/Auth/RequireAuth';
import RequireAdmin from './components/Auth/RequireAdmin';
import RequireAdminRole from './components/Auth/RequireAdminRole';

const App = () => {
  return (
    <BrowserRouter>
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

        <Route element={<RequireAdmin />}>
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route
            path="/admin/orders/:orderId"
            element={<AdminOrderDetails />}
          />
        </Route>

        <Route element={<RequireAdminRole />}>
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
