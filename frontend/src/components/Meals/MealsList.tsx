import React from 'react';
import classes from './MealsList.module.css';

import { Meal } from '../../types/cart';
import MealItem from './Meal/MealItem';

interface MealsListProps {
  meals: Meal[];
}

const MealsList = ({ meals }: MealsListProps) => {
  return (
    <div className={classes.MealsList}>
      {meals.map((meal) => (
        <MealItem key={meal._id} meal={meal} />
      ))}
    </div>
  );
};

export default MealsList;
