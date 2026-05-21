import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './Bar.module.css';
import { createOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { CART_ACTIONS } from '../../../../types/cart';

interface BarProps {
  totalPrice: number;
  onOrderComplete: () => void;
}

const Bar = ({ totalPrice, onOrderComplete }: BarProps) => {
  const navigate = useNavigate();
  const items = useCartSelector((ctx) => ctx.items);
  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);
  const clearQuote = useCartSelector((ctx) => ctx.clearQuote);
  const cartDispatch = useCartSelector((ctx) => ctx.cartDispatch);
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payHandler = async () => {
    if (items.length === 0 || isPaying) return;

    setMessage(null);
    setError(null);
    setIsPaying(true);

    try {
      await ensureQuote();
      await createOrder(items, menuVersion);
      cartDispatch({ type: CART_ACTIONS.CLEAR_CART });
      clearQuote();
      setMessage('Order placed');
      onOrderComplete();
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className={classes.Bar}>
      <div className={classes.TotalPrice}>{totalPrice.toFixed(2)}</div>
      <div className={classes.Actions}>
        {(error || message) && (
          <p className={error ? classes.Error : classes.Message}>
            {error ?? message}
          </p>
        )}
        <button
          className={classes.Button}
          disabled={items.length === 0 || isPaying}
          onClick={payHandler}
        >
          {isPaying ? 'Paying' : 'Pay'}
        </button>
      </div>
    </div>
  );
};

export default Bar;
