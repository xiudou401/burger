import React from 'react';
import type { CartMeal } from '../../../../types/cart';
import classes from './CheckoutItem.module.css';
import QuantityCounter from '../../../UI/Counter/QuantityCounter';
import { useCartSelector } from '../../../../hooks/useCartSelector';
import { getCartItemQuantity } from '../../../../store/cart/context-accessors';

interface CheckoutItemProps {
  meal: CartMeal;
}

const CheckoutItem = ({ meal }: CheckoutItemProps) => {
  const quantity = useCartSelector((ctx) =>
    getCartItemQuantity(ctx, meal.id),
  );

  if (quantity === 0) return null;

  return (
    <div className={classes.CheckoutItem}>
      <div className={classes.MealImg}>
        <img src={meal.image} alt={meal.name} />
      </div>

      <div className={classes.Desc}>
        <h2 className={classes.Title}>{meal.name}</h2>

        <div className={classes.PriceOuter}>
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
