import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import MealItem from '../../Meals/Meal/MealItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Confirm from '../../UI/Confirm/Confirm';
import { useCartActions } from '../../../hooks/useCartActions';
import { useCartSelector } from '../../../hooks/useCartSelector';

interface CartDetailsProps {
  open: boolean;
}

const CartDetails = ({ open }: CartDetailsProps) => {
  const { clearCart } = useCartActions();

  const itemsLength = useCartSelector((ctx) => ctx.items.length);
  const quote = useCartSelector((ctx) => ctx.quote);
  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (itemsLength === 0) return;
    ensureQuote();
  }, [open, itemsLength, ensureQuote]);

  const meals = useMemo(() => {
    return quote?.meals ?? [];
  }, [quote]);

  const handleClearCart = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const onOk = () => clearCart();
  const onCancel = () => setShowConfirm(false);

  return (
    <Backdrop>
      {showConfirm && (
        <Confirm confirmText="Are you sure?" onCancel={onCancel} onOk={onOk} />
      )}

      <div
        className={classes.CartDetails}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear} onClick={handleClearCart}>
            <FontAwesomeIcon icon={faTrash} />
            <span>清空购物车</span>
          </div>
        </header>

        <div className={classes.MealList}>
          {!quote && itemsLength > 0 && (
            <p style={{ padding: 12 }}>加载中...</p>
          )}

          {meals.map((meal) => (
            <MealItem key={meal.id} meal={meal} noDesc />
          ))}

          {quote && meals.length === 0 && (
            <p style={{ padding: 12, color: '#999' }}>购物车为空</p>
          )}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
