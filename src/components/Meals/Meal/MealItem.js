import QuantityCounter from '../../UI/Counter/QuantityCounter';
import classes from './MealItem.module.css';

const MealItem = ({ meal }) => {
  return (
    <div className={classes.MealItem}>
      <div className={classes.ImageWrapper}>
        <img src={meal.image} alt={meal.name} />
      </div>
      <div>
        <h2 className={classes.Name}>{meal.name}</h2>
        <p className={classes.Description}>{meal.description}</p>
        <div className={classes.PriceWrapper}>
          <span className={classes.Price}>{meal.price}</span>
          <QuantityCounter meal={meal} />
        </div>
      </div>
    </div>
  );
};

export default MealItem;
