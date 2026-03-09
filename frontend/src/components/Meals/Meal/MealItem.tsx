import React from 'react';
import classes from './MealItem.module.css';
import QuantityCounter from '../../UI/Counter/QuantityCounter';
import { Meal } from '../../../types/meal';
// import { useCartSelectors } from '../../../hooks/useCartSelectors';

interface MealItemProps {
  meal: Meal;
  noDesc?: boolean;
  quantity?: number; // ✅ 新增
  onFirstInteract?: () => void; // ✅ 新增
}

const MealItem = ({
  meal,
  noDesc,
  quantity = 0,
  onFirstInteract,
}: MealItemProps) => {
  // const { getItemQuantity } = useCartSelectors();
  // const quantity = getItemQuantity(meal.id); // ✅ 实时 quantity

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

          {/* ✅ Quantity 来自 cart state，不来自 meal */}
          <QuantityCounter
            id={meal.id}
            quantity={quantity}
            onFirstInteract={onFirstInteract}
          />
        </div>
      </div>
    </div>
  );
};

export default MealItem;
