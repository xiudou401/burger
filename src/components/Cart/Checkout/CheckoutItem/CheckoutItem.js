import QuantityCounter from '../../../UI/Counter/QuantityCounter';
import classes from './CheckoutItem.module.css';

const CheckoutItem = ({ meal }) => {
  return (
    <div className={classes.CheckoutItem}>
      <div className={classes.MealImg}>
        <img src={meal.image} alt="Meal" />
      </div>
      <div className={classes.Desc}>
        <h2 className={classes.Title}>{meal.name}</h2>
        <div className={classes.PriceOuter}>
          <QuantityCounter meal={meal} />
          <div className={classes.Price}>{meal.price * meal.quantity}</div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutItem;
