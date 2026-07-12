import React, { MouseEvent, useEffect, useState } from 'react';

import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';

import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';

import { useCartSelector } from '../../store/cart/hooks/useCartSelector';
import { useToast } from '../UI/Toast/ToastContext';
import { formatCurrency } from '../../utils/currency';

import {
  getTotalQuantity,
  getQuote,
  getQuoteStale,
  getQuoteMismatch,
  getEstimatedTotalPrice,
  getEnsureQuote,
  getClearQuote,
} from '../../store/cart/context-accessors';

const Cart = () => {
  const totalQuantity = useCartSelector(getTotalQuantity);

  const quote = useCartSelector(getQuote);

  const quoteStale = useCartSelector(getQuoteStale);

  const quoteMismatch = useCartSelector(getQuoteMismatch);

  const estimatedTotalCents = useCartSelector(getEstimatedTotalPrice);

  const ensureQuote = useCartSelector(getEnsureQuote);

  const clearQuote = useCartSelector(getClearQuote);
  const { showToast } = useToast();

  const [showCartDetails, setShowCartDetails] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);

  const toggleCartDetailsHandler = () => {
    if (totalQuantity === 0) return;

    if (!showCartDetails) {
      setShowCartDetails(true);

      ensureQuote().catch(() => {});

      return;
    }

    setShowCartDetails(false);
  };

  const onCheckout = async (e: MouseEvent<HTMLButtonElement>) => {
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

  const offCheckout = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (totalQuantity === 0) {
      setShowCheckout(false);

      setShowCartDetails(false);

      clearQuote();
    }
  }, [totalQuantity, clearQuote]);

  return (
    <div className={classes.Cart}>
      {showCartDetails && <CartDetails open={showCartDetails} />}

      {showCheckout && quote && (
        <Checkout offCheckout={offCheckout} menuItems={quote.menuItems} />
      )}

      <button
        type="button"
        className={classes.CartToggle}
        aria-expanded={showCartDetails}
        aria-controls="cart-details"
        disabled={totalQuantity === 0}
        onClick={toggleCartDetailsHandler}
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
            <span>Review cart</span>
          </span>
        ) : (
          <span className={classes.Price}>
            <span>
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
            </span>
            {formatCurrency(estimatedTotalCents)}
            {(quoteStale || quoteMismatch) && (
              <span className={classes.Estimate}>Estimate</span>
            )}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`${classes.BuyButton} ${
          totalQuantity === 0 ? classes.Disabled : ''
        }`}
        onClick={onCheckout}
      >
        Checkout
      </button>
    </div>
  );
};

export default Cart;
