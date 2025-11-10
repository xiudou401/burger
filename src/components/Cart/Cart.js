import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  const { totalQuantity, totalPrice } = cartCtx;

  const [cartDetails, setCartDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const toggleCartDetails = () => {
    if (cartCtx.totalQuantity === 0) {
      setCartDetails(false);
      return;
    }
    setCartDetails((prevState) => !prevState);
    console.log(cartDetails);
  };

  const showCheckoutHandler = (e) => {
    e.stopPropagation();
    setShowCheckout(true);
  };
  const hideCheckoutHandler = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (cartCtx.totalQuantity === 0) {
      setCartDetails(false);
      setShowCheckout(false);
    }
  }, [cartCtx.totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {cartDetails && <CartDetails />}
      {showCheckout && <Checkout hideCheckoutHandler={hideCheckoutHandler} />}
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
        onClick={showCheckoutHandler}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
