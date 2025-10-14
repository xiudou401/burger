import classes from './CheckoutItem.module.css';
import QuantityCounter from '../../../UI/Counter/QuantityCounter';

const CheckoutItem = ({ meal }) => {
  console.log(meal.name);

  return (
    <div className={classes.CheckoutItem}>
      <div className={classes.MealImg}>
        <img src={meal.image} alt={meal.name} />
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
