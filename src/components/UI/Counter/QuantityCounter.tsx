import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
// 只导入需要的类型和实例，简化写法（避免混淆）
import type { Meal, CartContextValue } from '../../../types/cart';
import { CartContext } from '../../../store/CartContext'; // 只导入实例
import classes from './QuantityCounter.module.css';

interface QuantityCounterProps {
  meal: Meal;
}

const QuantityCounter: React.FC<QuantityCounterProps> = ({ meal }) => {
  // 关键修正：泛型传「上下文数据类型 CartContextValue」，而非实例类型
  const cartCtx = useContext<CartContextValue>(CartContext);

  const quantity =
    cartCtx.items.find((item) => item.id === meal.id)?.quantity || 0;

  return (
    <div className={classes.Counter}>
      {quantity > 0 && (
        <>
          <button
            className={classes.Decrease}
            onClick={() => cartCtx.cartDispatch({ type: 'REMOVE', meal })}
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={classes.Quantity}>{quantity}</span>
        </>
      )}
      <button
        className={classes.Increase}
        onClick={() => cartCtx.cartDispatch({ type: 'ADD', meal })}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default QuantityCounter;
