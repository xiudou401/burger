import React, { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import classes from './Counter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const Counter = ({ meal }) => {
  const ctx = useContext(CartContext);
  const subButtonHandler = () => {
    ctx.removeMeal(meal);
  };

  const addButtonHandler = () => {
    ctx.addMeal(meal);
  };

  const cartItem = ctx.items.find((item) => item.id === meal.id);

  const amount = cartItem ? cartItem.amount : 0;

  return (
    <div className={classes.Counter}>
      {amount && amount !== 0 ? (
        <>
          <button onClick={subButtonHandler} className={classes.Sub}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.count}>{amount}</span>
        </>
      ) : null}

      <button onClick={addButtonHandler} className={classes.Add}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default Counter;
