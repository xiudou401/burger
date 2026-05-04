import React from 'react';
import type { CartMeal } from '../../../../types/cart';
import classes from './CheckoutItem.module.css';
import QuantityCounter from '../../../UI/Counter/QuantityCounter';
import { useCartSelector } from '../../../../hooks/useCart';
import { selectCartItemQuantity } from '../../../../store/cart/cart-selectors';

interface CheckoutItemProps {
  meal: CartMeal;
}

const CheckoutItem = ({ meal }: CheckoutItemProps) => {
  // 🎯 从 cart state 获取“真实数量”
  const quantity = useCartSelector((ctx) =>
    selectCartItemQuantity(ctx, meal.id),
  );

  // ✅ 数量为 0 → 自动从 UI 移除
  if (quantity === 0) return null;

  return (
    <div className={classes.CheckoutItem}>
      <div className={classes.MealImg}>
        <img src={meal.image} alt={meal.name} />
      </div>

      <div className={classes.Desc}>
        <h2 className={classes.Title}>{meal.name}</h2>

        <div className={classes.PriceOuter}>
          {/* ❗ 不再传 quantity */}
          <QuantityCounter id={meal.id} />

          <div className={classes.Price}>
            {(meal.price * quantity).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CheckoutItem);
