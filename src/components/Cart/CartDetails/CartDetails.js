import { useContext, useState } from 'react';
import Backdrop from '../../UI/Backdrop/Backdrop';
import classes from './CartDetails.module.css';
import { CartContext } from '../../../store/CartContext';
import MealItem from '../../Meals/Meal/MealItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Confirm from '../../UI/Confirm/Confirm';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);
  const cartItems = cartCtx.items;

  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <Backdrop>
      <div
        className={classes.CartDetails}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {showConfirm && <Confirm />}
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear}>
            <FontAwesomeIcon icon={faTrash} />
            <span>Clear Cart</span>
          </div>
        </header>
        <div className={classes.MealList}>
          {cartItems.map((item) => (
            <MealItem key={item.id} meal={item} noDesc />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
