import classes from './Bar.module.css';

const Bar = ({ totalPrice }) => {
  return (
    <div className={classes.Bar}>
      <div className={classes.TotalPrice}>{totalPrice}</div>
      <button className={classes.Button}>Pay</button>
    </div>
  );
};

export default Bar;
