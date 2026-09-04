import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLoadingFallback from '../components/Auth/AuthLoadingFallback';
import { useToast } from '../components/UI/Toast/ToastContext';
import { useAuth } from '../store/auth/hooks/useAuth';
import { getObjectIdOrNull } from '../utils/object-id';

const buildOrderPath = (orderId: string | null) =>
  orderId ? `/orders/${orderId}` : '/profile';

const buildLoginState = (orderId: string | null) => ({
  from: {
    pathname: buildOrderPath(orderId),
  },
});

const PaymentReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const handledRef = useRef(false);
  const payment = searchParams.get('payment');
  const orderId = getObjectIdOrNull(searchParams.get('orderId'));

  useEffect(() => {
    if (handledRef.current || isAuthLoading) return;

    handledRef.current = true;

    if (payment === 'success') {
      if (!isAuthenticated) {
        navigate('/login', {
          replace: true,
          state: buildLoginState(orderId),
        });
        return;
      }

      navigate(buildOrderPath(orderId), {
        replace: true,
        state: { returnedFromSuccessfulPayment: true },
      });
      return;
    }

    if (payment === 'cancelled') {
      showToast({
        message: 'Payment was cancelled.',
        tone: 'info',
      });
    }

    navigate(isAuthenticated ? '/profile' : '/', { replace: true });
  }, [isAuthLoading, isAuthenticated, navigate, orderId, payment, showToast]);

  return <AuthLoadingFallback />;
};

export default PaymentReturn;
