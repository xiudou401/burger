import React from 'react';
import { Meal } from '../../types/cart';
import MealItem from './Meal/MealItem';
import classes from './MealsList.module.css';

interface MealsListProps {
  meals: Meal[];
}

const MealsList: React.FC<MealsListProps> = ({ meals }) => {
  return (
    <div className={classes.MealsList}>
      {meals.map((meal: Meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </div>
  );
};

export default MealsList;
