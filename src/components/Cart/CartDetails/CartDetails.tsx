import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Backdrop from '../../UI/Backdrop/Backdrop';
import classes from './CartDetails.module.css';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import React, { MouseEvent, useContext, useState } from 'react';
import { CartContext } from '../../../store/CartContext';
import MealItem from '../../Meals/Meal/MealItem';
import Confirm from '../../UI/Confirm/Confirm';
import { CartContextValue, CartItem } from '../../../types/cart';

const CartDetails: React.FC = () => {
  const cartCtx = useContext<CartContextValue>(CartContext);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const onCancel = (): void => {
    setShowConfirm(false);
  };
  const onOk = (): void => {
    cartCtx.cartDispatch({ type: 'CLEAR' });
  };

  const handleCartDetailsClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  // 9. 抽离清空购物车事件（简化内联逻辑）
  const handleClearCart = (): void => {
    setShowConfirm(true);
  };

  return (
    <Backdrop>
      <div className={classes.CartDetails} onClick={handleCartDetailsClick}>
        {showConfirm && (
          <Confirm
            confirmText="Are you sure?"
            onCancel={onCancel}
            onOk={onOk}
          />
        )}
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear} onClick={handleClearCart}>
            <FontAwesomeIcon icon={faTrash} />
            <span>清空购物车</span>
          </div>
        </header>
        <div className={classes.MealList}>
          {cartCtx.items.map((item: CartItem) => (
            <MealItem key={item.id} meal={item} noDesc />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
