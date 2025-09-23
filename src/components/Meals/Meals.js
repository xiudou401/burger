import Meal from './Meal/Meal';
import classes from './Meals.module.css';

const Meals = ({ mealsData }) => {
  return (
    <div className={classes.Meals}>
      {mealsData.map((meal) => (
        <Meal key={meal.id} meal={meal} />
      ))}
    </div>
  );
};

export default Meals;
