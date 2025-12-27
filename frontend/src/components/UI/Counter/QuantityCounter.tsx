import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Meal } from '../../../types/meal';
import { useCartActions } from '../../../hooks/useCartActions';
import { useCartSelectors } from '../../../hooks/useCartSelectors';

interface QuantityCounterProps {
  meal: Meal;
}

const QuantityCounter = ({ meal }: QuantityCounterProps) => {
  const { addItem, removeItem } = useCartActions();
  const { getItemQuantity } = useCartSelectors();
  const id = meal.id;
  const quantity = getItemQuantity(id);

  const onIncrease = () => {
    addItem(meal);
  };

  const onDecrease = () => {
    removeItem(id);
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
