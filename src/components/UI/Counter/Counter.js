import { useContext } from 'react';
import classes from './Counter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const Counter = ({ meal }) => {
  const ctx = useContext(CartContext);
  const addMealHandler = () => {
    ctx.addMeal(meal);
  };
  const removeMealHandler = () => {
    ctx.removeMeal(meal);
  };
  const cartMeal = ctx.items.find((item) => item.id === meal.id);
  const amount = cartMeal ? cartMeal.amount : 0;

  return (
    <div className={classes.Counter}>
      {amount > 0 ? (
        <>
          <button className={classes.Sub} onClick={removeMealHandler}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.count}>{amount}</span>
        </>
      ) : null}
      <button className={classes.Add} onClick={addMealHandler}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default Counter;
