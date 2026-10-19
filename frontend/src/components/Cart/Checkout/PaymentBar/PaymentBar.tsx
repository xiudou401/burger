import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classes from './PaymentBar.module.css';
import BottomActionBar from '../../BottomActionBar/BottomActionBar';
import CartSummary from '../../CartSummary/CartSummary';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import { hasPermission } from '../../../../types/permissions';
import {
  getCheckoutAttempt,
  readCheckoutAttempt,
  clearCheckoutAttempt,
  getSupersededCheckoutKeys,
  acknowledgeSupersededCheckouts,
} from '../../../../utils/checkout-attempt';
import { ApiError } from '../../../../api/request';
import { getCheckoutErrorMessage } from '../checkout-utils';
import { getQuoteUnitPriceChanges } from '../../../../store/cart/utils/quote-utils';
import { getPriceUpdatedNotice } from '../../../../store/cart/utils/quote-notice';

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
  const quote = useCartSelector((ctx) => ctx.quote);
  const quoteMismatch = useCartSelector((ctx) => ctx.quoteMismatch);
  const quoteNotice = useCartSelector((ctx) => ctx.quoteNotice);
  const quoteStale = useCartSelector((ctx) => ctx.quoteStale);
  const validateQuoteForUserAction = useCartSelector(
    (ctx) => ctx.validateQuoteForUserAction,
  );
  const user = useAuth((ctx) => ctx.user);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const { showToast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPayingRef = useRef(false);
  const reviewedCheckoutRef = useRef<string | null>(null);

  const canCreateOrder = hasPermission(user, 'create_order');
  const isConfirmingPrice = quoteMismatch || quoteStale;
  const helperText =
    isAuthenticated && !canCreateOrder
      ? STAFF_CHECKOUT_MESSAGE
      : (quoteNotice ?? 'Secure checkout powered by Stripe');

  const handlePayClick = async () => {
    if (items.length === 0 || isPayingRef.current || isAuthLoading) return;

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
    isPayingRef.current = true;
    setIsPaying(true);

    try {
      if (!user) return;
      const existingAttempt = readCheckoutAttempt(user.id, items);
      const validatedQuote = existingAttempt
        ? quote
        : await validateQuoteForUserAction();
      const priceChangeNotice = getPriceUpdatedNotice(
        validatedQuote ? getQuoteUnitPriceChanges(quote, validatedQuote) : [],
      );

      if (priceChangeNotice) {
        setMessage(priceChangeNotice);
        return;
      }

      const attemptKey = getCheckoutAttempt(user.id, items);
      const supersededKeys = getSupersededCheckoutKeys(user.id);
      const { checkoutUrl, order } = await createCheckoutOrder(
        items,
        validatedQuote?.menuVersion ?? menuVersion ?? 0,
        attemptKey,
        ...(supersededKeys.length ? [supersededKeys] : []),
      );
      acknowledgeSupersededCheckouts(user.id, attemptKey, order.id);
      const reviewKey = JSON.stringify([
        order.id,
        order.items?.map((item) => [
          item.menuItemId,
          item.priceCents,
          item.quantity,
        ]),
      ]);
      const quotePrices = new Map(
        quote?.menuItems.map((item) => [item.id, item.priceCents]),
      );
      const needsReview = order.items?.some(
        (item) => quotePrices.get(item.menuItemId) !== item.priceCents,
      );
      if (needsReview && reviewedCheckoutRef.current !== reviewKey) {
        reviewedCheckoutRef.current = reviewKey;
        setMessage(
          `Your saved checkout total is $${(order.totalCents / 100).toFixed(2)}. Click Pay with Stripe again to continue with this quote.`,
        );
        return;
      }
      setMessage('Redirecting to secure payment');
      onOrderComplete();
      window.location.assign(checkoutUrl);
    } catch (err) {
      if (err instanceof ApiError && user) {
        const code = err.body.details?.code;
        if (code === 'ORDER_ALREADY_PAID') {
          const orderId = err.body.details?.orderId;
          if (typeof orderId === 'string')
            navigate(`/orders/${orderId}`, {
              state: { returnedFromSuccessfulPayment: true },
            });
          return;
        }
        if (code === 'CHECKOUT_ENDED' || code === 'CHECKOUT_CART_MISMATCH') {
          clearCheckoutAttempt(user.id);
          reviewedCheckoutRef.current = null;
          setError(
            'Your previous checkout has ended. Please review your cart and try again.',
          );
          return;
        }
      }
      const errorMessage = getCheckoutErrorMessage(err, quote);

      setError(errorMessage);
      showToast({ message: errorMessage, tone: 'error' });
    } finally {
      isPayingRef.current = false;
      setIsPaying(false);
    }
  };

  const paymentSummary = (
    <div className={classes.Summary}>
      <CartSummary totalQuantity={totalQuantity} totalCents={totalCents} />
    </div>
  );

  const paymentAction = (
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
    <BottomActionBar
      summary={paymentSummary}
      action={paymentAction}
      variant="checkout"
    />
  );
};

export default PaymentBar;
