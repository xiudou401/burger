import Counter from '../../UI/Counter/Counter';
import classes from './Meal.module.css';

const Meal = ({ meal }) => {
  return (
    <div className={classes.Meal}>
      <div className={classes.ImgBox}>
        <img src={meal.img} alt="burger" />
      </div>
      <div>
        <h2 className={classes.Title}>{meal.title}</h2>
        <p className={classes.Desc}>{meal.desc}</p>
        <div className={classes.PriceWrap}>
          <span className={classes.Price}>{meal.price}</span>
          <Counter meal={meal} />
        </div>
      </div>
    </div>
  );
};

export default Meal;
