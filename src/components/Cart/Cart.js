import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';
const Cart = () => {
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const cartCtx = useContext(CartContext);
  const totalQuantity = cartCtx.totalQuantity;

  const toggleCartDetails = () => {
    if (totalQuantity === 0) {
      setShowCartDetails(false);
      return;
    }
    setShowCartDetails((prev) => !prev);
  };

  const cancelShowCheckout = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (totalQuantity === 0) {
      setShowCartDetails(false);
      setShowCheckout(false);
    }
  }, [totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {showCartDetails && <CartDetails />}
      {showCheckout && <Checkout cancelShowCheckout={cancelShowCheckout} />}
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="cart" />
        {totalQuantity === 0 ? null : (
          <span className={classes.TotalQuantity}>{totalQuantity}</span>
        )}
      </div>
      {totalQuantity === 0 ? (
        <p className={classes.NoMeal}>Cart is empty</p>
      ) : (
        <p className={classes.Price}>{cartCtx.totalPrice}</p>
      )}
      <button
        className={`${classes.BuyButton} ${
          totalQuantity === 0 ? classes.Disabled : ''
        }`}
        onClick={() => {
          setShowCheckout(true);
        }}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
