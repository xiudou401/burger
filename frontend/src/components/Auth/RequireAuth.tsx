import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import AuthLoadingFallback from './AuthLoadingFallback';

const RequireAuth = () => {
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const payment = searchParams.get('payment');
  const isPaymentReturn =
    location.pathname === '/profile' &&
    (payment === 'success' || payment === 'cancelled');

  if (isAuthLoading) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    if (isPaymentReturn) {
      return (
        <Navigate
          to={`/payment/return${location.search}`}
          replace
          state={{ from: location }}
        />
      );
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
