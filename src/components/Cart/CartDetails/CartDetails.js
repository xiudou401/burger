import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import MealItem from '../../Meals/Meal/MealItem';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);

  return (
    <Backdrop>
      <div className={classes.CartDetails} onClick={(e) => e.stopPropagation()}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear}>
            <FontAwesomeIcon icon={faTrash} />
            <span
              onClick={() => {
                cartCtx.cartDispatch({ type: 'CLEAR' });
              }}
            >
              清空购物车
            </span>
          </div>
        </header>

        <div className={classes.MealList}>
          {cartCtx.items.map((item) => (
            <MealItem noDesc key={item.id} meal={item} />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
