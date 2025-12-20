import React, { MouseEvent, useContext } from 'react';
import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { CartContext } from '../../../store/CartContext';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';

const CheckoutRoot = document.getElementById('checkout-root');

interface CheckoutProps {
  offCheckout: () => void;
}

const Checkout = ({ offCheckout }: CheckoutProps) => {
  const { items, totalPrice } = useContext(CartContext);
  if (!CheckoutRoot) {
    return null;
  }

  const offCheckoutHandler = () => {
    offCheckout();
  };
  return ReactDOM.createPortal(
    <div
      className={classes.Checkout}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
      }}
    >
      <div className={classes.Close} onClick={offCheckoutHandler}>
        <FontAwesomeIcon icon={faXmark} />
      </div>
      <div className={classes.MealDesc}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Order Details</h2>
        </header>
        <div>
          {items.map((item) => (
            <CheckoutItem key={item.id} meal={item} />
          ))}
        </div>
        <footer className={classes.Footer}>
          <p className={classes.TotalPrice}>{totalPrice}</p>
        </footer>
      </div>
      <Bar totalPrice={totalPrice} />
    </div>,
    CheckoutRoot
  );
};

export default Checkout;
