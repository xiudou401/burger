import React, { useContext } from 'react';
import { CART_ACTIONS, Meal } from '../../../types/cart';
import classes from './QuantityCounter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

interface QuantityCounterProps {
  meal: Meal;
}

const QuantityCounter = ({ meal }: QuantityCounterProps) => {
  const { items, cartDispatch } = useContext(CartContext);
  const mealInCart = items.find((item) => item.id === meal.id);
  const quantity = mealInCart ? mealInCart.quantity : 0;

  const onIncrease = () => {
    cartDispatch({ type: CART_ACTIONS.ADD, meal });
  };

  const onDecrease = () => {
    cartDispatch({ type: CART_ACTIONS.REMOVE, meal });
  };

  return (
    <div className={classes.Counter}>
      {quantity > 0 && (
        <>
          <button className={classes.Decrease} onClick={onDecrease}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      )}
      <button className={classes.Increase} onClick={onIncrease}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default QuantityCounter;
