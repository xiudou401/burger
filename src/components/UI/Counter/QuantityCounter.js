import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './QuantityCounter.module.css';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);

  return (
    <div className={classes.Counter}>
      {meal.quantity && (
        <>
          <button
            className={classes.Decrease}
            onClick={() => {
              cartCtx.removeFromCart(meal);
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{meal.quantity}</span>
        </>
      )}
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
