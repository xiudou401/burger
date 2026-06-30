import React, { MouseEvent, useMemo } from 'react';
import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';
import type { CartMenuItem } from '../../../types/cart';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import { formatCurrency } from '../../../utils/currency';

const CheckoutRoot = document.getElementById('checkout-root');

interface CheckoutProps {
  offCheckout: () => void;
  menuItems: CartMenuItem[];
}

const Checkout = ({ offCheckout, menuItems }: CheckoutProps) => {
  const estimatedTotalCents = useCartSelector((ctx) => ctx.estimatedTotalCents);

  const items = useCartSelector((ctx) => ctx.items);

  const visibleMenuItems = useMemo(() => {
    const qtyMap = new Map(items.map((i) => [i.id, i.quantity]));

    return menuItems.filter((item) => (qtyMap.get(item.id) ?? 0) > 0);
  }, [menuItems, items]);

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

      <div className={classes.OrderSummary}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Order Details</h2>
        </header>

        <div>
          {visibleMenuItems.map((menuItem) => (
            <CheckoutItem key={menuItem.id} menuItem={menuItem} />
          ))}
        </div>

        <footer className={classes.Footer}>
          <p className={classes.TotalPrice}>
            Total {formatCurrency(estimatedTotalCents)}
          </p>
        </footer>
      </div>

      <Bar totalCents={estimatedTotalCents} onOrderComplete={offCheckout} />
    </div>,
    CheckoutRoot,
  );
};

export default Checkout;
