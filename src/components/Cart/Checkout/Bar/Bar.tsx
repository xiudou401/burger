import React from 'react';
import classes from './Bar.module.css';

interface BarProps {
  totalPrice: number;
}

const Bar: React.FC<BarProps> = ({ totalPrice }) => {
  return (
    <div className={classes.Bar}>
      <div className={classes.TotalPrice}>{totalPrice}</div>
      <button className={classes.Button}>Pay</button>
    </div>
  );
};

export default Bar;
