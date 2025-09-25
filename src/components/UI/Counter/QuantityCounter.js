import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import classes from './QuantityCounter.module.css';
import { CartContext } from '../../../store/CartContext';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);
  const cartItem = cartCtx.items.find((item) => item.id === meal.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className={classes.Counter}>
      {quantity > 0 && (
        <>
          <button
            onClick={() => cartCtx.removeFromCart(meal)}
            className={classes.Decrease}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      )}
      <button
        onClick={() => cartCtx.addToCart(meal)}
        className={classes.Increase}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default QuantityCounter;
