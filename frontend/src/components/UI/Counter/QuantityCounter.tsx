import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCartContext } from '../../../hooks/useCart';
import { Meal } from '../../../types/meal';
import { useCartActions } from '../../../hooks/useCartActions';

interface QuantityCounterProps {
  meal: Meal;
}

const QuantityCounter = ({ meal }: QuantityCounterProps) => {
  const { items } = useCartContext();
  const { addItem, removeItem } = useCartActions();
  const mealInCart = items.find((item) => item._id === meal._id);
  const quantity = mealInCart ? mealInCart.quantity : 0;
  const _id = meal._id;

  const onIncrease = () => {
    addItem(meal);
  };

  const onDecrease = () => {
    removeItem(_id);
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
