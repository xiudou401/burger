import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import { useContext } from 'react';
import { CartContext } from '../../store/CartContext';

const Cart = () => {
  const cartCtx = useContext(CartContext);
  return (
    <div className={classes.Cart}>
      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="cart" />
        <span className={classes.TotalAmount}>{cartCtx.totalQuantity}</span>
      </div>
      <p className={classes.Price}>{cartCtx.totalPrice}</p>
      <button className={classes.BuyButton}>Buy</button>
    </div>
  );
};

export default Cart;
