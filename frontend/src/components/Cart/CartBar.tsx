import React, { MouseEvent, useEffect, useState } from 'react';

import classes from './CartBar.module.css';

import BottomActionBar from './BottomActionBar/BottomActionBar';
import CartDetails from './CartDetails/CartDetails';
import CheckoutDialog from './Checkout/CheckoutDialog';
import CartSummary from './CartSummary/CartSummary';

import { useCartSelector } from '../../store/cart/hooks/useCartSelector';
import { useToast } from '../UI/Toast/ToastContext';

import {
  getTotalQuantity,
  getQuote,
  getEstimatedTotalCents,
  getEnsureQuote,
  getClearQuote,
} from '../../store/cart/context-accessors';

const CartBar = () => {
  const totalQuantity = useCartSelector(getTotalQuantity);

  const quote = useCartSelector(getQuote);

  const estimatedTotalCents = useCartSelector(getEstimatedTotalCents);

  const ensureQuote = useCartSelector(getEnsureQuote);

  const clearQuote = useCartSelector(getClearQuote);
  const { showToast } = useToast();

  const [showCartDetails, setShowCartDetails] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);

  const handleCartDetailsToggle = () => {
    if (totalQuantity === 0) return;

    if (!showCartDetails) {
      setShowCartDetails(true);
      return;
    }

    setShowCartDetails(false);
  };

  const handleCheckoutClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (totalQuantity === 0) return;

    try {
      await ensureQuote();

      setShowCheckout(true);
    } catch {
      showToast({
        message: 'Cart validation failed. Please try again.',
        tone: 'error',
      });
    }
  };

  const closeCheckout = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (totalQuantity === 0) {
      setShowCheckout(false);

      setShowCartDetails(false);

      clearQuote();
    }
  }, [totalQuantity, clearQuote]);

  const cartSummary = (
    <button
      type="button"
      className={classes.CartToggle}
      aria-expanded={showCartDetails}
      aria-controls="cart-details"
      disabled={totalQuantity === 0}
      onClick={handleCartDetailsToggle}
    >
      <CartSummary
        totalQuantity={totalQuantity}
        totalCents={quote ? estimatedTotalCents : undefined}
      />
    </button>
  );

  const checkoutAction = (
    <button
      type="button"
      className={`${classes.BuyButton} ${
        totalQuantity === 0 ? classes.Disabled : ''
      }`}
      onClick={handleCheckoutClick}
    >
      Checkout
    </button>
  );

  return (
    <>
      {showCartDetails && <CartDetails open={showCartDetails} />}

      {showCheckout && quote && (
        <CheckoutDialog onClose={closeCheckout} menuItems={quote.menuItems} />
      )}

      <BottomActionBar summary={cartSummary} action={checkoutAction} />
    </>
  );
};

export default CartBar;
