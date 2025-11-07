import React, { useContext, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import CartDetails from './CartDetails/CartDetails';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  const { totalQuantity, totalPrice } = cartCtx;

  const [cartDetails, setCartDetails] = useState(false);

  const toggleCartDetails = () => {
    if (cartCtx.totalQuantity === 0) return;
    setCartDetails((prevState) => !prevState);
    console.log(cartDetails);
  };

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {cartDetails && <CartDetails />}
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
