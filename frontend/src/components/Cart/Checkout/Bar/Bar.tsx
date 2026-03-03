import React from 'react';
import classes from './Bar.module.css';

interface BarProps {
  totalPrice: number;
}

const Bar = ({ totalPrice }: BarProps) => {
  return (
    <div className={classes.Bar}>
      <div className={classes.TotalPrice}>{totalPrice.toFixed(2)}</div>
      <button className={classes.Button}>Pay</button>
    </div>
  );
};

export default Bar;
