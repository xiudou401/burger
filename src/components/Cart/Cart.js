import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';

const Cart = () => {
  const cartCtx = useContext(CartContext);

  // 添加一个state来设置详情是否显示
  const [showDetails, setShowDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // 添加一个显示详情页的函数
  const toggleDetailsHandler = () => {
    if (cartCtx.totalQuantity === 0) {
      setShowDetails(false);
      return;
    }
    setShowDetails((prevState) => !prevState);
  };
  const showCheckoutHandler = () => {
    if (cartCtx.totalQuantity === 0) return;
    setShowCheckout(true);
  };
  const hideCheckoutHandler = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    if (cartCtx.totalQuantity === 0) {
      setShowCheckout(false);
      setShowDetails(false);
    }
  }, [cartCtx.totalQuantity]);
  return (
    <div className={classes.Cart} onClick={toggleDetailsHandler}>
      {showCheckout && <Checkout hideCheckoutHandler={hideCheckoutHandler} />}
      {/* {showDetails && cartCtx.totalQuantity !== 0 && <CartDetails />} */}
      {showDetails && <CartDetails />}
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
