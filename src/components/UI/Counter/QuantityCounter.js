import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './QuantityCounter.module.css';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);

  const cartMeal = cartCtx.items.find((item) => item.id === meal.id);

  const quantity = cartMeal ? cartMeal.quantity : null;

  return (
    <div className={classes.Counter}>
      {quantity ? (
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
