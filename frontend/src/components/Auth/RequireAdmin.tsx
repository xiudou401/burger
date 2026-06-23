import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import AuthLoadingFallback from './AuthLoadingFallback';

const RequireAdmin = () => {
  const user = useAuth((ctx) => ctx.user);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return <Navigate to="/admin/login?error=Admin access required" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
