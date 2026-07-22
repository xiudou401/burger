import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classes from './PaymentBar.module.css';
import BottomActionBar from '../../BottomActionBar/BottomActionBar';
import CartSummary from '../../CartSummary/CartSummary';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import { ApiError } from '../../../../api/request';
import { HTTP_STATUS } from '../../../../api/http-status';
import { hasPermission } from '../../../../types/permissions';
import { createCheckoutAttemptKey } from '../../../../utils/idempotency';
import { getQuoteErrorMessage } from '../../../../store/cart/utils/quote-error';

interface PaymentBarProps {
  totalCents: number;
  onOrderComplete: () => void;
}

const STAFF_CHECKOUT_MESSAGE =
  'Admin and staff accounts cannot place customer orders';

const PaymentBar = ({ totalCents, onOrderComplete }: PaymentBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useCartSelector((ctx) => ctx.items);
  const totalQuantity = useCartSelector((ctx) => ctx.totalQuantity);
  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const quoteMismatch = useCartSelector((ctx) => ctx.quoteMismatch);
  const quoteNotice = useCartSelector((ctx) => ctx.quoteNotice);
  const quoteStale = useCartSelector((ctx) => ctx.quoteStale);
  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);
  const user = useAuth((ctx) => ctx.user);
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

  const canCreateOrder = hasPermission(user, 'create_order');
  const isConfirmingPrice = quoteMismatch || quoteStale;
  const helperText =
    isAuthenticated && !canCreateOrder
      ? STAFF_CHECKOUT_MESSAGE
      : (quoteNotice ?? 'Secure checkout powered by Stripe');

  const handlePayClick = async () => {
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

    if (!canCreateOrder) {
      const message = STAFF_CHECKOUT_MESSAGE;
      setError(message);
      showToast({ message, tone: 'error' });
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
        : err instanceof ApiError
          ? `${getQuoteErrorMessage(err)}${requestId}`
          : err instanceof Error
            ? `${err.message}${requestId}`
            : 'Could not place order';

      setError(errorMessage);
      showToast({ message: errorMessage, tone: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  const summary = (
    <div className={classes.Summary}>
      <CartSummary totalQuantity={totalQuantity} totalCents={totalCents} />
    </div>
  );

  const action = (
    <div className={classes.Actions}>
      {(error || message) && (
        <p className={error ? classes.Error : classes.Message}>
          {error ?? message}
        </p>
      )}
      {!error && !message && <p className={classes.HelperText}>{helperText}</p>}
      <button
        className={classes.Button}
        type="button"
        disabled={
          items.length === 0 ||
          isPaying ||
          menuVersion === null ||
          isAuthLoading
        }
        onClick={handlePayClick}
      >
        <span className={classes.ButtonText}>
          {isPaying
            ? 'Redirecting...'
            : isConfirmingPrice
              ? 'Confirming price...'
              : 'Pay with Stripe'}
        </span>
      </button>
    </div>
  );

  return (
    <BottomActionBar summary={summary} action={action} variant="checkout" />
  );
};

export default PaymentBar;
