import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classes from './Bar.module.css';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import { formatCurrency } from '../../../../utils/currency';
import { ApiError } from '../../../../api/request';
import { HTTP_STATUS } from '../../../../api/http-status';

interface BarProps {
  totalCents: number;
  onOrderComplete: () => void;
}

const Bar = ({ totalCents, onOrderComplete }: BarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useCartSelector((ctx) => ctx.items);
  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const { showToast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payHandler = async () => {
    if (items.length === 0 || isPaying || isAuthLoading) return;

    if (!isAuthenticated) {
      showToast({
        message: 'Please log in before paying with Stripe.',
        tone: 'error',
      });
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    setMessage(null);
    setError(null);
    setIsPaying(true);

    try {
      await ensureQuote();

      if (menuVersion === null) {
        throw new Error('Menu is still loading');
      }

      const { checkoutUrl } = await createCheckoutOrder(items, menuVersion);
      setMessage('Redirecting to secure payment');
      onOrderComplete();
      window.location.assign(checkoutUrl);
    } catch (err) {
      const isMenuConflict =
        err instanceof ApiError && err.statusCode === HTTP_STATUS.CONFLICT;
      const requestId =
        err instanceof ApiError && err.requestId
          ? ` Reference: ${err.requestId}`
          : '';
      const errorMessage = isMenuConflict
        ? `Some menu items have changed. Please review your cart before checkout.${requestId}`
        : err instanceof Error
          ? `${err.message}${requestId}`
          : 'Could not place order';

      setError(errorMessage);
      showToast({ message: errorMessage, tone: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className={classes.Bar}>
      <div className={classes.TotalPrice}>{formatCurrency(totalCents)}</div>
      <div className={classes.Actions}>
        {(error || message) && (
          <p className={error ? classes.Error : classes.Message}>
            {error ?? message}
          </p>
        )}
        <button
          className={classes.Button}
          disabled={
            items.length === 0 ||
            isPaying ||
            menuVersion === null ||
            isAuthLoading
          }
          onClick={payHandler}
        >
          {isPaying ? 'Redirecting' : 'Pay with Stripe'}
        </button>
      </div>
    </div>
  );
};

export default Bar;
