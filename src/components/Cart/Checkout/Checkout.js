import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './Checkout.module.css';
import ReactDOM from 'react-dom';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import Bar from './Bar/Bar';
const CheckoutRoot = document.getElementById('checkout-root');
const Checkout = ({ hideShowCheckoutHandler }) => {
  const cartCtx = useContext(CartContext);
  return ReactDOM.createPortal(
    <div className={classes.Checkout}>
      <div className={classes.Close} onClick={hideShowCheckoutHandler}>
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
      </div>
      <Bar totalPrice={cartCtx.totalPrice} />s
    </div>,
    CheckoutRoot
  );
};

export default Checkout;
