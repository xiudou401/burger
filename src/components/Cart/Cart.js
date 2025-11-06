import React, { useContext } from 'react';
import { CartContext } from '../../store/CartContext';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  //   console.log(cartCtx);
  return (
    <div className={classes.Cart}>
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="cart" />
        {cartCtx.totalQuantity === 0 ? null : (
          <span className={classes.TotalQuantity}>{cartCtx.totalQuantity}</span>
        )}
      </div>
      {cartCtx.totalQuantity === 0 ? (
        <p className={classes.NoMeal}>Cart is empty</p>
      ) : (
        <p className={classes.Price}>{cartCtx.totalPrice}</p>
      )}
      <button
        className={`${classes.BuyButton} ${
          cartCtx.totalQuantity === 0 ? classes.Disabled : ''
        } `}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
