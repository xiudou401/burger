import React, { MouseEvent, useMemo } from 'react';
import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';
import type { CartMeal } from '../../../types/cart';
import { useCartSelector } from '../../../hooks/useCartSelector';

const CheckoutRoot = document.getElementById('checkout-root');

interface CheckoutProps {
  offCheckout: () => void;
  meals: CartMeal[];
}

const Checkout = ({ offCheckout, meals }: CheckoutProps) => {
  // ✅ 只订阅 totalPrice（已经帮你算好的）
  const estimatedTotalPrice = useCartSelector((ctx) => ctx.estimatedTotalPrice);

  // ❗ 如果你仍然想用 quote meals（推荐）
  const items = useCartSelector((ctx) => ctx.items);

  // ✅ 只过滤“有数量的 meal”，不计算 quantity
  const visibleMeals = useMemo(() => {
    const qtyMap = new Map(items.map((i) => [i.id, i.quantity]));

    return meals.filter((m) => (qtyMap.get(m.id) ?? 0) > 0);
  }, [meals, items]);

  if (!CheckoutRoot) return null;

  const offCheckoutHandler = () => offCheckout();

  return ReactDOM.createPortal(
    <div
      className={classes.Checkout}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
    >
      <div className={classes.Close} onClick={offCheckoutHandler}>
        <FontAwesomeIcon icon={faXmark} />
      </div>

      <div className={classes.MealsDesc}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Order Details</h2>
        </header>

        <div>
          {visibleMeals.map((meal) => (
            <CheckoutItem key={meal.id} meal={meal} />
          ))}
        </div>

        <footer className={classes.Footer}>
          <p className={classes.TotalPrice}>{estimatedTotalPrice.toFixed(2)}</p>
        </footer>
      </div>

      <Bar totalPrice={estimatedTotalPrice} />
    </div>,
    CheckoutRoot,
  );
};

export default Checkout;
