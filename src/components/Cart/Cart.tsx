import React, { MouseEvent, useContext, useEffect, useState } from 'react';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';

const Cart = () => {
  const { totalQuantity, totalPrice } = useContext(CartContext);
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const toggleCartDetailsHandler = () => {
    if (totalQuantity === 0) return;
    setShowCartDetails((prevState) => !prevState);
  };

  const onCheckout = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (totalQuantity === 0) return;
    setShowCheckout(true);
  };
  const offCheckout = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (totalQuantity === 0) {
      setShowCheckout(false);
      setShowCartDetails(false);
    }
  }, [totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetailsHandler}>
      {showCartDetails && <CartDetails />}
      {showCheckout && <Checkout offCheckout={offCheckout} />}
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="Shopping bag" />
        {totalQuantity > 0 && (
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
          totalQuantity === 0 && classes.Disabled
        }`}
        onClick={onCheckout}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
