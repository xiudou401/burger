import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { hasPermission, type Permission } from '../../types/permissions';
import AuthLoadingFallback from './AuthLoadingFallback';

interface RequirePermissionProps {
  permission: Permission;
}

const RequirePermission = ({ permission }: RequirePermissionProps) => {
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

  if (!hasPermission(user, permission)) {
    if (hasPermission(user, 'view_orders')) {
      return <Navigate to="/admin/orders" replace />;
    }

    return <Navigate to="/admin/login?error=Admin access required" replace />;
  }

  return <Outlet />;
};

export default RequirePermission;
