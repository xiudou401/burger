import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const toggleCartDetails = () => {
    if (cartCtx.totalQuantity === 0) {
      setShowCartDetails(false);
      return;
    }
    setShowCartDetails((prevState) => !prevState);
  };

  const showCheckoutHandler = (e) => {
    if (cartCtx.totalQuantity === 0) {
      setShowCheckout(false);
      return;
    }
    e.stopPropagation();
    setShowCheckout(true);
  };
  const hideShowCheckoutHandler = (e) => {
    setShowCheckout(false);
    e.stopPropagation();
  };

  useEffect(() => {
    if (cartCtx.totalQuantity === 0) {
      setShowCartDetails(false);
      setShowCheckout(false);
    }
  }, [cartCtx.totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {showCartDetails && <CartDetails />}
      {showCheckout && (
        <Checkout hideShowCheckoutHandler={hideShowCheckoutHandler} />
      )}
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
        }`}
        onClick={showCheckoutHandler}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
