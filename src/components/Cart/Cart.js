import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  const [showCartDetails, setShowCartDetails] = useState(false);

  const toggleCartDetails = () => {
    setShowCartDetails((prevState) => !prevState);
  };

  useEffect(() => {
    if (cartCtx.totalQuantity === 0) {
      setShowCartDetails(false);
    }
  }, [cartCtx.totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {showCartDetails && <CartDetails />}
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
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
