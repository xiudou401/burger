import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Backdrop from '../../UI/Backdrop/Backdrop';
import classes from './CartDetails.module.css';
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
            <span>清空购物车</span>
          </div>
        </header>
        <div className={classes.MealList}>
          {cartCtx.items.map((item) => (
            <MealItem key={item.id} meal={item} />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
