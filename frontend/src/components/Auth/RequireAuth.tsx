import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';

const RequireAuth = () => {
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
