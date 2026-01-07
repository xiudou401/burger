import React, { forwardRef } from 'react';
import classes from './MealsList.module.css';
import MealItem from './Meal/MealItem';
import { Meal } from '../../types/meal';

interface MealsListProps {
  meals: Meal[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const MealsList = forwardRef<HTMLDivElement, MealsListProps>(
  ({ meals, sentinelRef }, ref) => {
    return (
      <div className={classes.MealsList} ref={ref}>
        {meals.map((meal) => (
          <MealItem key={meal.id} meal={meal} />
        ))}

        <div ref={sentinelRef} style={{ height: 30 }} />
      </div>
    );
  }
);

export default MealsList;
