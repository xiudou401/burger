import classes from './Counter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const Counter = ({ amount }) => {
  return (
    <div className={classes.Counter}>
      {amount > 0 ? (
        <>
          <button className={classes.Sub}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.count}>{amount}</span>
        </>
      ) : null}
      <button className={classes.Add}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default Counter;
