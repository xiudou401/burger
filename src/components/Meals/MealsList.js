import MealItem from './Meal/MealItem';
import classes from './MealsList.module.css';

const MealsList = ({ meals }) => {
  return (
    <div className={classes.MealsList}>
      {meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </div>
  );
};

export default MealsList;
