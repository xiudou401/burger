import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCartActions } from '../../../store/cart/hooks/useCartActions';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import { getCartItemQuantity } from '../../../store/cart/context-accessors';

interface QuantityCounterProps {
  id: string;
}

const QuantityCounter = ({ id }: QuantityCounterProps) => {
  const { addItem, removeItem } = useCartActions();

  const quantity = useCartSelector((ctx) => getCartItemQuantity(ctx, id));

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
