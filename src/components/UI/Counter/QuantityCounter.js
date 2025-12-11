import React, { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import classes from './QuantityCounter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityCounter = ({ meal }) => {
  const cartCtx = useContext(CartContext);
  const quantity =
    cartCtx.items.find((item) => item.id === meal.id)?.quantity || 0;
  return (
    <div className={classes.Counter}>
      {quantity > 0 && (
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
