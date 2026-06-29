import React from 'react';
import classes from './MealItem.module.css';
import QuantityCounter from '../../UI/Counter/QuantityCounter';
import { Meal } from '../../../types/meal';
import { formatCurrency } from '../../../utils/currency';

interface MealItemProps {
  meal: Meal;
  noDesc?: boolean;
}

const MealItem = ({ meal, noDesc }: MealItemProps) => {
  const categoryLabel = meal.category[0].toUpperCase() + meal.category.slice(1);

  return (
    <div
      className={`${classes.MealItem} ${
        meal.isAvailable ? '' : classes.SoldOut
      }`}
    >
      <div className={classes.ImageWrapper}>
        <img src={meal.image} alt={meal.name} />
      </div>

      <div className={classes.DescBox}>
        <div className={classes.Badges}>
          <span className={classes.CategoryBadge}>{categoryLabel}</span>
          {meal.isFeatured && (
            <span className={classes.FeaturedBadge}>Popular</span>
          )}
          {!meal.isAvailable && (
            <span className={classes.SoldOutBadge}>Sold out</span>
          )}
        </div>

        <h2 className={classes.Name}>{meal.name}</h2>

        {!noDesc && <p className={classes.Description}>{meal.description}</p>}

        <div className={classes.PriceWrapper}>
          <span className={classes.Price}>
            {formatCurrency(meal.priceCents)}
          </span>

          <QuantityCounter id={meal.id} disabled={!meal.isAvailable} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(MealItem);
