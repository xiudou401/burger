import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';

const checkoutRoot = document.getElementById('checkout-root');

const Checkout = ({ hideCheckoutHandler }) => {
  const cartCtx = useContext(CartContext);
  return ReactDOM.createPortal(
    <div className={classes.Checkout}>
      <div
        className={classes.Close}
        onClick={(e) => {
          e.stopPropagation();
          hideCheckoutHandler();
        }}
      >
        <FontAwesomeIcon icon={faXmark} />
      </div>
      <div className={classes.MealDesc}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Order Details</h2>
        </header>
        <div>
          {cartCtx.items.map((item) => (
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
