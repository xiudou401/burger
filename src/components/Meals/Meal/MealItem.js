import QuantityCounter from '../../UI/Counter/QuantityCounter';
import classes from './MealItem.module.css';

const MealItem = ({ meal, noDesc }) => {
  return (
    <div className={classes.MealItem}>
      <div className={classes.ImageWrapper}>
        <img src={meal.image} alt={meal.name} />
      </div>
      <div className={classes.DescBox}>
        <h2 className={classes.Name}>{meal.name}</h2>
        {noDesc ? null : (
          <p className={classes.Description}>{meal.description}</p>
        )}

        <div className={classes.PriceWrapper}>
          <span className={classes.Price}>{meal.price}</span>
          <QuantityCounter meal={meal} />
        </div>
      </div>
    </div>
  );
};

export default MealItem;
