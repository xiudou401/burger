import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';

const RequireAdmin = () => {
  const user = useAuth((ctx) => ctx.user);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return <Navigate to="/admin/login?error=Admin access required" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
