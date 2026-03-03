import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCartActions } from '../../../hooks/useCartActions';

interface QuantityCounterProps {
  id: string;
  quantity: number;
  onFirstInteract?: () => void;
}

const QuantityCounter = ({
  id,
  quantity,
  onFirstInteract,
}: QuantityCounterProps) => {
  const { addItem, removeItem } = useCartActions();

  const onDecrease = () => {
    onFirstInteract?.();
    removeItem(id);
  };

  const onIncrease = () => {
    onFirstInteract?.();
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
