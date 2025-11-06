import React from 'react';
import MealItem from './Meal/MealItem';

const MealsList = ({ meals }) => {
  return (
    <div>
      {meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </div>
  );
};

export default MealsList;
