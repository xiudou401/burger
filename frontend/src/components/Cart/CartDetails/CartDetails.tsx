import React, { MouseEvent, useContext, useState } from 'react';
import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import MealItem from '../../Meals/Meal/MealItem';
import { CartContext } from '../../../store/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Confirm from '../../UI/Confirm/Confirm';
import { CART_ACTIONS } from '../../../types/cart';

const CartDetails = () => {
  const { items, cartDispatch } = useContext(CartContext);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearCart = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const onOk = () => {
    cartDispatch({ type: CART_ACTIONS.CLEAR });
  };

  const onCancel = () => {
    setShowConfirm(false);
  };
  return (
    <Backdrop>
      {showConfirm && (
        <Confirm confirmText="Are you sure?" onCancel={onCancel} onOk={onOk} />
      )}
      <div
        className={classes.CartDetails}
        onClick={(e: MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
        }}
      >
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear} onClick={handleClearCart}>
            <FontAwesomeIcon icon={faTrash} />
            <span>清空购物车</span>
          </div>
        </header>
        {items.map((item) => (
          <MealItem key={item.id} meal={item} noDesc />
        ))}
      </div>
    </Backdrop>
  );
};

export default CartDetails;
