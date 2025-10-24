import { useContext } from 'react';
import classes from './QuantityCounter.module.css';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);
  if (!cartCtx || !cartCtx.items) {
    return <div>数据加载中...</div>;
  }

  const meal1 = cartCtx.items.find((item) => item.id === meal.id);
  const quantity = meal1 ? meal1.quantity : 0;
  return (
    <div className={classes.Counter}>
      {quantity > 0 ? (
        <>
          <button
            className={classes.Decrease}
            onClick={() => {
              cartCtx.cartDispatch({ type: 'REMOVE', meal });
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      ) : null}
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
