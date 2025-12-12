import MealItem from './Meal/MealItem';
import classes from './MealsList.module.css';
import type { Meal } from '../../types/cart';
import React from 'react';

interface MealsListProps {
  meals: Meal[];
}

const MealsList: React.FC<MealsListProps> = ({ meals }) => {
  return (
    <div className={classes.MealsList}>
      {meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </div>
  );
};

export default MealsList;
