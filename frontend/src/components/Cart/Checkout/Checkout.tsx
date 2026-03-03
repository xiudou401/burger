import React, { MouseEvent, useMemo } from 'react';
import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';
import type { CartMeal } from '../../../types/cart';
import { calculateTotals } from './checkout-utils';
import { useCartSelectors } from '../../../hooks/useCartSelectors';

const CheckoutRoot = document.getElementById('checkout-root');

interface CheckoutProps {
  offCheckout: () => void;
  meals: CartMeal[];
}

const Checkout = ({ offCheckout, meals }: CheckoutProps) => {
  const { getItemQuantity } = useCartSelectors();

  // ✅ Hook 一定要在最外层
  const mealsWithLiveQty = useMemo(() => {
    return meals
      .map((m) => ({ ...m, quantity: getItemQuantity(m.id) }))
      .filter((m) => m.quantity > 0);
  }, [meals, getItemQuantity]);

  const { totalPrice } = useMemo(
    () => calculateTotals(mealsWithLiveQty),
    [mealsWithLiveQty],
  );

  // ✅ 所有 Hook 调完之后，再判断是否 return
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
          {mealsWithLiveQty.map((meal) => (
            <CheckoutItem key={meal.id} meal={meal} />
          ))}
        </div>

        <footer className={classes.Footer}>
          <p className={classes.TotalPrice}>{totalPrice.toFixed(2)}</p>
        </footer>
      </div>

      <Bar totalPrice={totalPrice} />
    </div>,
    CheckoutRoot,
  );
};

export default Checkout;
