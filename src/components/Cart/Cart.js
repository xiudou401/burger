import React, { useContext } from 'react';
import CartContext from '../../store/CartContext';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';

const Cart = () => {
  const ctx = useContext(CartContext);
  return (
    <div className={classes.Cart}>
      <div className={classes.Icon}>
        <img src={iconImg} alt="icon" />
        <span className={classes.TotalAmount}>{ctx.totalAmount}</span>
      </div>
      <p className={classes.Price}>{ctx.totalPrice}</p>
      <button className={classes.Button}>Check out</button>
    </div>
  );
};

export default Cart;
