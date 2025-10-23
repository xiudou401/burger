import { useContext } from 'react';
import classes from './QuantityCounter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);
  const meal1 = cartCtx.items.find((item) => item.id === meal.id);
  const quantity = meal1 ? meal1.quantity : null;
  return (
    <div className={classes.Counter}>
      {quantity > 0 ? (
        <>
          <button className={classes.Decrease}>
            <FontAwesomeIcon
              icon={faMinus}
              onClick={() => {
                cartCtx.removeFromCart(meal);
              }}
            />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      ) : null}
      <button className={classes.Increase}>
        <FontAwesomeIcon
          icon={faPlus}
          onClick={() => {
            cartCtx.addToCart(meal);
          }}
        />
      </button>
    </div>
  );
};

export default QuantityCounter;
