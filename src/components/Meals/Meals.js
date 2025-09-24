import Meal from './Meal/Meal';
import classes from './Meals.module.css';

const Meals = ({ meals }) => {
  return (
    <div className={classes.Meals}>
      {meals.map((meal) => (
        <Meal key={meal.id} meal={meal} />
      ))}
    </div>
  );
};

export default Meals;
