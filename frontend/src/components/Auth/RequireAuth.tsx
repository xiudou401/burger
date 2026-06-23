import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import AuthLoadingFallback from './AuthLoadingFallback';

const RequireAuth = () => {
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
