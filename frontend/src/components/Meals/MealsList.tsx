import React, { forwardRef } from 'react';
import classes from './MealsList.module.css';
import MealItem from './Meal/MealItem';
import { Meal } from '../../types/meal';

interface MealsListProps {
  meals: Meal[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

// 🔹 使用 forwardRef 将 MealsList 的 div 暴露给 App
const MealsList = forwardRef<HTMLDivElement, MealsListProps>((props, ref) => {
  return (
    <div className={classes.MealsList} ref={ref}>
      {props.meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}

      {/* 🔹 哨兵元素：必须放在滚动容器内部的最下方 */}
      <div
        ref={props.sentinelRef}
        style={{ height: '30px', background: 'transparent' }}
      />
    </div>
  );
});

export default MealsList;
