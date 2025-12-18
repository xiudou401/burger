import React from 'react';
import { Meal } from '../../../types/cart';
import classes from './QuantityCounter.module.css';

interface QuantityCounterProps {
  meal: Meal;
}

const QuantityCounter = ({ meal }: QuantityCounterProps) => {
  return <div className={classes.Counter}></div>;
};

export default QuantityCounter;
