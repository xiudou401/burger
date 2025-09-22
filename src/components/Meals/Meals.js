import React from 'react';
import Meal from './Meal/Meal';
import classes from './Meals.module.css';

/*
 *   食物列表的组件
 * */
const Meals = ({ mealsData, onAdd, onSub }) => {
  return (
    /*现在将滚动条设置给了Meals*/
    <div className={classes.Meals}>
      {mealsData.map((meal) => (
        <Meal key={meal.id} meal={meal} onAdd={onAdd} onSub={onSub} />
      ))}
    </div>
  );
};

export default Meals;
