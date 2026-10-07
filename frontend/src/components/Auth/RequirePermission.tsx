import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
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
  const revalidateSession = useAuth((ctx) => ctx.revalidateSession);
  const location = useLocation();
  const hasRevalidatedRef = useRef(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [didRevalidationFail, setDidRevalidationFail] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || hasRevalidatedRef.current) {
      return;
    }

    let isActive = true;

    hasRevalidatedRef.current = true;
    setDidRevalidationFail(false);
    setIsRevalidating(true);

    revalidateSession()
      .catch(() => {
        if (!isActive) return;

        setDidRevalidationFail(true);
      })
      .finally(() => {
        if (!isActive) return;

        setIsRevalidating(false);
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isAuthLoading, revalidateSession]);

  if (isAuthLoading || isRevalidating) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated || didRevalidationFail) {
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
