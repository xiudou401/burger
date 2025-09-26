import { useContext } from 'react';
import classes from './QuantityCounter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);
  const cartItem = cartCtx.items.find((item) => item.id === meal.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className={classes.Counter}>
      {quantity > 0 ? (
        <>
          <button
            className={classes.Decrease}
            onClick={() => {
              cartCtx.removeFromCart(meal);
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      ) : null}
      <button
        className={classes.Increase}
        onClick={() => {
          cartCtx.addToCart(meal);
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default QuantityCounter;
