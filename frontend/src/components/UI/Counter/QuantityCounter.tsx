import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCartActions } from '../../../hooks/useCartActions';
import { useCartSelector } from '../../../hooks/useCartSelector';
import { selectCartItemQuantity } from '../../../store/cart/cart-selectors';

interface QuantityCounterProps {
  id: string;
}

const QuantityCounter = ({ id }: QuantityCounterProps) => {
  const { addItem, removeItem } = useCartActions();

  // 🎯 核心：只订阅当前 item
  const quantity = useCartSelector((ctx) => selectCartItemQuantity(ctx, id));

  const onDecrease = () => {
    removeItem(id);
  };

  const onIncrease = () => {
    addItem(id);
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
