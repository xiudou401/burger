import classes from './Counter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import CartContext from '../../../store/CartContext';

const Counter = ({ meal }) => {
  const ctx = useContext(CartContext);
  const addButtonHandler = () => {
    ctx.addItem(meal);
  };

  // 删除食物的函数
  const subButtonHandler = () => {
    ctx.removeItem(meal);
  };
  return (
    <div className={classes.Counter}>
      {meal.amount > 0 ? (
        <>
          <button className={classes.Sub} onClick={subButtonHandler}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.count}>{meal.amount}</span>
        </>
      ) : null}
      <button className={classes.Add} onClick={addButtonHandler}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default Counter;
