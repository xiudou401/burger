import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext, useState } from 'react';
import { CartContext } from '../../store/CartContext';
import CartDetails from './CartDetails/CartDetails';

const Cart = () => {
  const cartCtx = useContext(CartContext);

  // 添加一个state来设置详情是否显示
  const [showDetails, setShowDetails] = useState(false);

  // 添加一个显示详情页的函数
  const toggleDetailsHandler = () => {
    if (cartCtx.totalQuantity === 0) return;
    setShowDetails((prevState) => !prevState);
  };
  return (
    <div className={classes.Cart} onClick={toggleDetailsHandler}>
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
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
