import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';

const RequireAuth = () => {
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
