import classes from './Counter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const Counter = ({ meal, onAdd, onSub }) => {
  const addButtonHandler = () => {
    onAdd(meal);
  };

  // 删除食物的函数
  const subButtonHandler = () => {
    onSub(meal);
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
