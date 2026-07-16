import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classes from './PaymentBar.module.css';
import BottomActionBar from '../../BottomActionBar/BottomActionBar';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import { formatCurrency } from '../../../../utils/currency';
import { ApiError } from '../../../../api/request';
import { HTTP_STATUS } from '../../../../api/http-status';

interface PaymentBarProps {
  totalCents: number;
  onOrderComplete: () => void;
}

const createCheckoutAttemptKey = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) =>
    (Number(char) ^ ((Math.random() * 16) >> (Number(char) / 4))).toString(16),
  );
};

const PaymentBar = ({ totalCents, onOrderComplete }: PaymentBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useCartSelector((ctx) => ctx.items);
  const totalQuantity = useCartSelector((ctx) => ctx.totalQuantity);
  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const { showToast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkoutAttemptKeyRef = useRef<string | null>(null);

  useEffect(() => {
    checkoutAttemptKeyRef.current = null;
  }, [items, menuVersion]);

  const getCheckoutAttemptKey = () => {
    checkoutAttemptKeyRef.current =
      checkoutAttemptKeyRef.current ?? createCheckoutAttemptKey();

    return checkoutAttemptKeyRef.current;
  };

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

      const { checkoutUrl } = await createCheckoutOrder(
        items,
        menuVersion,
        getCheckoutAttemptKey(),
      );
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

  const itemCountText = `${totalQuantity} ${
    totalQuantity === 1 ? 'item' : 'items'
  }`;

  const summary = (
    <div className={classes.Summary}>
      <div className={classes.TotalPrice}>{formatCurrency(totalCents)}</div>
      <div className={classes.ItemCount}>{itemCountText}</div>
    </div>
  );

  const action = (
    <div className={classes.Actions}>
      {(error || message) && (
        <p className={error ? classes.Error : classes.Message}>
          {error ?? message}
        </p>
      )}
      {!error && !message && (
        <p className={classes.HelperText}>Secure checkout powered by Stripe</p>
      )}
      <button
        className={classes.Button}
        type="button"
        disabled={
          items.length === 0 ||
          isPaying ||
          menuVersion === null ||
          isAuthLoading
        }
        onClick={payHandler}
      >
        <span className={classes.ButtonText}>
          {isPaying ? 'Redirecting...' : 'Pay with Stripe'}
        </span>
      </button>
    </div>
  );

  return (
    <BottomActionBar summary={summary} action={action} variant="checkout" />
  );
};

export default PaymentBar;
