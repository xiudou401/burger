import ReactDOM from 'react-dom';
import classes from './Checkout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';

const checkoutRoot = document.getElementById('checkout-root');

const Checkout = ({ cancelShowCheckout }) => {
  const cartCtx = useContext(CartContext);
  return ReactDOM.createPortal(
    <div className={classes.Checkout}>
      <div className={classes.Close} onClick={cancelShowCheckout}>
        <FontAwesomeIcon icon={faXmark} />
      </div>
      <div className={classes.MealDesc}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Order Details</h2>
        </header>
        <div>
          {cartCtx.items.map((item) => (
            <CheckoutItem key={item.id} meal={item} />
          ))}
        </div>
        <Bar totalPrice={cartCtx.totalPrice} />
      </div>
    </div>,
    checkoutRoot
  );
};

export default Checkout;
