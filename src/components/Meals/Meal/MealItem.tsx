import React from 'react';
import { Meal } from '../../../types/cart';
import QuantityCounter from '../../UI/Counter/QuantityCounter';
import classes from './MealItem.module.css';

interface MealItemProps {
  meal: Meal;
  noDesc?: boolean;
}
const MealItem: React.FC<MealItemProps> = ({ meal, noDesc }) => {
  return (
    <div className={classes.MealItem}>
      <div className={classes.ImageWrapper}>
        <img src={meal.image} alt={meal.name} />
      </div>
      <div className={classes.DescBox}>
        <h2 className={classes.Name}>{meal.name}</h2>
        {!noDesc && <p className={classes.Description}>{meal.description}</p>}
        <div className={classes.PriceWrapper}>
          <span className={classes.Price}>{meal.price}</span>
          <QuantityCounter meal={meal} />
        </div>
      </div>
    </div>
  );
};

export default MealItem;
