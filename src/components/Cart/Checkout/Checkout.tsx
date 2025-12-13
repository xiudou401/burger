import React, { useContext, MouseEvent } from 'react';
import { CartContext } from '../../../store/CartContext';
import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';
import { CartContextValue, CartItem } from '../../../types/cart';

const checkoutRoot = document.getElementById('checkout-root');

interface CheckoutProps {
  hideCheckoutHandler: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ hideCheckoutHandler }) => {
  const cartCtx = useContext<CartContextValue>(CartContext);
  const onHide = (e: MouseEvent<SVGSVGElement>): void => {
    e.stopPropagation();
    hideCheckoutHandler();
  };

  if (!checkoutRoot) return null;
  return ReactDOM.createPortal(
    <div
      className={classes.Checkout}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
      }}
    >
      <div className={classes.Close}>
        <FontAwesomeIcon icon={faXmark} onClick={onHide} />
      </div>
      <div className={classes.MealDesc}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Order Details</h2>
        </header>
        <div>
          {cartCtx.items.map((item: CartItem) => (
            <CheckoutItem meal={item} key={item.id} />
          ))}
        </div>
        <footer className={classes.Footer}>
          <p className={classes.TotalPrice}>{cartCtx.totalPrice}</p>
        </footer>
      </div>
      <Bar totalPrice={cartCtx.totalPrice} />
    </div>,
    checkoutRoot
  );
};

export default Checkout;
