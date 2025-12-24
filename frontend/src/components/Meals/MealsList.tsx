import React from 'react';
import classes from './MealsList.module.css';

import MealItem from './Meal/MealItem';
import { Meal } from '../../types/meal';

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
