import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';
import MealItem from '../../Meals/Meal/MealItem';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);
  return (
    <Backdrop>
      <div
        className={classes.CartDetails}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear}>
            <FontAwesomeIcon icon={faTrash} />
            <span>Clear Cart</span>
          </div>
        </header>
        <div className={classes.MealList}>
          {cartCtx.items.map((item) => (
            <MealItem key={item.id} meal={item} noDesc />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
