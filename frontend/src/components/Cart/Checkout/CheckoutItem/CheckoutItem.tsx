import React from 'react';
import type { CartMeal } from '../../../../types/cart';
import classes from './CheckoutItem.module.css';
import QuantityCounter from '../../../UI/Counter/QuantityCounter';
import { useCartSelectors } from '../../../../hooks/useCartSelectors';

interface CheckoutItemProps {
  meal: CartMeal;
}

const CheckoutItem = ({ meal }: CheckoutItemProps) => {
  const { getItemQuantity } = useCartSelectors();
  // const quantity = getItemQuantity(meal.id); // ✅ 实时数量（来自 CartStoredItem）

  // ✅ 数量为 0 时直接不渲染（这样就“从列表移除”了）
  // if (quantity === 0) return null;

  return (
    <div className={classes.CheckoutItem}>
      <div className={classes.MealImg}>
        <img src={meal.image} alt="Meal" />
      </div>
      <div className={classes.Desc}>
        <h2 className={classes.Title}>{meal.name}</h2>
        <div className={classes.PriceOuter}>
          <QuantityCounter id={meal.id} quantity={meal.quantity} />
          <div className={classes.Price}>
            {(meal.price * meal.quantity).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutItem;
