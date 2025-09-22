import React from 'react';
import classes from './Meal.module.css';
import Counter from '../../UI/Counter/Couter';

/*
 *   食物组件
 * */
const Meal = ({ meal }) => {
  return (
    <div className={classes.Meal}>
      <div className={classes.ImgBox}>
        <img src={meal.img} alt="meal" />
      </div>
      <div>
        <h2 className={classes.Title}>{meal.title}</h2>
        <p className={classes.Desc}>{meal.desc}</p>
        <div className={classes.PriceWrap}>
          <span className={classes.Price}>{meal.price}</span>
          <Counter amount={2} />
        </div>
      </div>
    </div>
  );
};

export default Meal;
