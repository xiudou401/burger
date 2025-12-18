import React from 'react';
import classes from './MealItem.module.css';
import { Meal } from '../../../types/cart';
import QuantityCounter from '../../UI/Counter/QuantityCounter';

interface MealItemProps {
  meal: Meal;
  noDesc?: boolean;
}

const MealItem = ({ meal, noDesc }: MealItemProps) => {
  return (
    <div className={classes.MealItem}>
      <div className={classes.ImageWrapper}>
        <img src={meal.image} alt={meal.name} />
      </div>
      <div className={classes.DescBox}>
        <h2 className={classes.Name}>{meal.name}</h2>
        {!noDesc && <p className={classes.Description}>{meal.description}</p>}
      </div>
      <div className={classes.PriceWrapper}>
        <span className={classes.Price}>{meal.price}</span>
        <QuantityCounter meal={meal} />
      </div>
    </div>
  );
};

export default MealItem;
