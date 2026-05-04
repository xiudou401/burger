import React from 'react';
import classes from './MealItem.module.css';
import QuantityCounter from '../../UI/Counter/QuantityCounter';
import { Meal } from '../../../types/meal';
// import { useCartSelector } from '../../../hooks/useCart';
// import { selectCartItemQuantity } from '../../../store/cart/cart-selectors';

interface MealItemProps {
  meal: Meal;
  noDesc?: boolean;
}

const MealItem = ({ meal, noDesc }: MealItemProps) => {
  // 🎯 只订阅当前商品的 quantity
  // const quantity = useCartSelector((ctx) =>
  //   selectCartItemQuantity(ctx, meal.id),
  // );

  return (
    <div className={classes.MealItem}>
      <div className={classes.ImageWrapper}>
        <img src={meal.image} alt={meal.name} />
      </div>

      <div className={classes.DescBox}>
        <h2 className={classes.Name}>{meal.name}</h2>

        {!noDesc && <p className={classes.Description}>{meal.description}</p>}

        <div className={classes.PriceWrapper}>
          <span className={classes.Price}>{meal.price.toFixed(2)}</span>

          {/* 不再传 quantity */}
          <QuantityCounter id={meal.id} />

          {/* 如果你想显示数量（可选） */}
          {/* {quantity > 0 && <span className={classes.QtyText}>x{quantity}</span>} */}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MealItem);
