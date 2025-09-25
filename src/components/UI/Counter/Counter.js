import { useContext } from 'react';
import classes from './Counter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const Counter = ({ meal }) => {
  const ctx = useContext(CartContext);

  console.log(ctx);
  const cartMeal = ctx.items.find((item) => item.id === meal.id);
  const amount = cartMeal ? cartMeal.amount : 0;
  // console.log(amount);

  const addMealHandler = () => {
    ctx.addMeal(meal);
  };
  const removeMealHandler = () => {
    ctx.removeMeal(meal);
  };
  return (
    <div className={classes.Counter}>
      {amount > 0 && (
        <>
          <button onClick={removeMealHandler} className={classes.Sub}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.count}>{amount}</span>
        </>
      )}
      <button onClick={addMealHandler} className={classes.Add}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default Counter;
