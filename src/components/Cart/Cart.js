import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';
const Cart = () => {
  const [showCartDetails, setShowCartDetails] = useState(false);

  const cartCtx = useContext(CartContext);
  const totalQuantity = cartCtx.totalQuantity;

  const toggleCartDetails = () => {
    if (totalQuantity === 0) {
      setShowCartDetails(false);
      return;
    }
    setShowCartDetails((prev) => !prev);
  };

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {showCartDetails && <CartDetails />}
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
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
