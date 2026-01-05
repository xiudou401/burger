import React, { forwardRef } from 'react';
import classes from './MealsList.module.css';
import MealItem from './Meal/MealItem';
import { Meal } from '../../types/meal';

interface MealsListProps {
  meals: Meal[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const MealsList = forwardRef<HTMLDivElement, MealsListProps>((props, ref) => {
  return (
    <div className={classes.MealsList} ref={ref}>
      {props.meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}

      <div
        ref={props.sentinelRef}
        style={{ height: '30px', background: 'transparent' }}
      />
    </div>
  );
});

export default MealsList;
