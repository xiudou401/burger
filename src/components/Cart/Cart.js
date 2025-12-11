import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  const [showDetails, setShowDetails] = useState(false);
  const toggleCartDetails = () => {
    if (cartCtx.totalQuantity === 0) {
      setShowDetails(false);
      return;
    }
    setShowDetails((prevState) => !prevState);
  };

  useEffect(() => {
    if (cartCtx.totalQuantity === 0) {
      setShowDetails(false);
    }
  }, [cartCtx.totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {showDetails && <CartDetails />}
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="Shopping bag" />
        {cartCtx.totalQuantity && (
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
