import React, { forwardRef } from 'react';
import classes from './MealsList.module.css';
import MealItem from './Meal/MealItem';
import { Meal } from '../../types/meal';
import { useCartSelectors } from '../../hooks/useCartSelectors';

interface MealsListProps {
  meals: Meal[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const MealsList = forwardRef<HTMLDivElement, MealsListProps>(
  ({ meals, sentinelRef }, ref) => {
    const { getItemQuantity, ensureQuote } = useCartSelectors();

    return (
      <div className={classes.MealsList} ref={ref}>
        {meals.map((meal) => (
          <MealItem
            key={meal.id}
            meal={meal}
            quantity={getItemQuantity(meal.id)}
            onFirstInteract={ensureQuote}
          />
        ))}

        <div ref={sentinelRef} style={{ height: 30 }} />
      </div>
    );
  },
);

export default MealsList;
