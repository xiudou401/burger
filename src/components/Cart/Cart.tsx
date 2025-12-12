import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';
import { CartContextValue } from '../../types/cart';

const Cart: React.FC = () => {
  const cartCtx = useContext<CartContextValue>(CartContext);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const toggleCartDetails = (): void => {
    if (cartCtx.totalQuantity === 0) {
      setShowDetails(false);
      return;
    }
    setShowDetails((prevState) => !prevState);
  };

  const showCheckoutHandler = (): void => {
    if (cartCtx.totalQuantity === 0) {
      setShowCheckout(false);
      return;
    }
    setShowCheckout(true);
  };

  const hideCheckoutHandler = (): void => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (cartCtx.totalQuantity === 0) {
      setShowDetails(false);
      setShowCheckout(false);
    }
  }, [cartCtx.totalQuantity]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetails}>
      {showDetails && <CartDetails />}
      {showCheckout && <Checkout hideCheckoutHandler={hideCheckoutHandler} />}
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="Shopping bag" />
        {cartCtx.totalQuantity > 0 && (
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
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          showCheckoutHandler();
        }}
        disabled={cartCtx.totalQuantity === 0}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
