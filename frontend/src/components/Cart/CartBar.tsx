import React, { MouseEvent, useEffect, useState } from 'react';

import classes from './CartBar.module.css';
import iconImg from '../../assets/bag.png';

import BottomActionBar from './BottomActionBar/BottomActionBar';
import CartDetails from './CartDetails/CartDetails';
import CheckoutDialog from './Checkout/CheckoutDialog';

import { useCartSelector } from '../../store/cart/hooks/useCartSelector';
import { useToast } from '../UI/Toast/ToastContext';
import { formatCurrency } from '../../utils/currency';

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

      ensureQuote().catch(() => {});

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
      <span className={classes.CartIcon}>
        <img
          className={classes.CartIconImg}
          src={iconImg}
          alt=""
          aria-hidden="true"
        />

        {totalQuantity > 0 && (
          <span className={classes.TotalQuantity}>{totalQuantity}</span>
        )}
      </span>

      {totalQuantity === 0 ? (
        <span className={classes.EmptyCartText}>Cart is empty</span>
      ) : !quote ? (
        <span className={classes.Price}>
          {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
        </span>
      ) : (
        <span className={classes.Price}>
          <span>
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
          </span>
          {formatCurrency(estimatedTotalCents)}
        </span>
      )}
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
