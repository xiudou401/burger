import React, { useContext } from 'react';
import { CartContext } from '../../store/CartContext';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  const { totalQuantity, totalPrice } = cartCtx;

  return (
    <div className={classes.Cart}>
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="cart" />
        {totalQuantity === 0 ? null : (
          <span className={classes.TotalQuantity}>{totalQuantity}</span>
        )}
      </div>
      {totalQuantity === 0 ? (
        <p className={classes.NoMeal}>Cart is empty</p>
      ) : (
        <p className={classes.Price}>{totalPrice}</p>
      )}
      <button
        className={`${classes.BuyButton} ${
          totalQuantity === 0 ? classes.Disabled : ''
        }`}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
