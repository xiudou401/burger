import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './Counter.module.css';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import CartContext from '../../../store/CartContext';

const Counter = ({ meal }) => {
  const ctx = useContext(CartContext);

  const cartItem = ctx.items.find((item) => item.id === meal.id);

  const amount = cartItem ? cartItem.amount : 0;

  const addMeal = () => {
    ctx.addItem(meal);
    console.log(amount);
  };

  const removeMeal = () => {
    ctx.removeItem(meal);
  };
  return (
    <div className={classes.Counter}>
      {amount && amount !== 0 ? (
        <>
          <button className={classes.Sub} onClick={removeMeal}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.count}>{amount}</span>
        </>
      ) : null}
      <button className={classes.Add} onClick={addMeal}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default Counter;
