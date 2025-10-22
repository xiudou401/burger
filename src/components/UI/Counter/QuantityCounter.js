import { useContext } from 'react';
import classes from './QuantityCounter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);

  const meal1 = cartCtx.items.find((item) => item.id === meal.id);

  return (
    <div className={classes.Counter}>
      {meal1 && (
        <>
          <button
            className={classes.Decrease}
            onClick={() => {
              cartCtx.cartDispatch({ type: 'REMOVE', meal });
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{meal.quantity}</span>
        </>
      )}
      <button
        className={classes.Increase}
        onClick={() => {
          cartCtx.cartDispatch({ type: 'ADD', meal });
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default QuantityCounter;
