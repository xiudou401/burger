import React, { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { CART_ACTIONS, CartContextValue, Meal } from '../../../types/cart';

interface QuantityCounterProps {
  meal: Meal;
}

const QuantityCounter: React.FC<QuantityCounterProps> = ({ meal }) => {
  const cartCtx = useContext<CartContextValue>(CartContext);
  const quantity =
    cartCtx.items.find((item) => item.id === meal.id)?.quantity || 0;
  return (
    <div className={classes.Counter}>
      {quantity > 0 && (
        <>
          <button
            className={classes.Decrease}
            onClick={() => {
              cartCtx.cartDispatch({ type: CART_ACTIONS.REMOVE, meal });
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      )}
      <button
        className={classes.Increase}
        onClick={() => {
          cartCtx.cartDispatch({ type: CART_ACTIONS.ADD, meal });
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default QuantityCounter;
