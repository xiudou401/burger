import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useContext, useState } from 'react';
import { CartContext } from '../../../store/CartContext';
import MealItem from '../../Meals/Meal/MealItem';
import Confirm from '../../UI/Confirm/Confirm';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);
  const [showConfirm, setShowConfirm] = useState(false);

  const cancelShowConfirm = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };
  const cartClearHandler = () => {
    cartCtx.cartDispatch({ type: 'CLEAR' });
  };
  return (
    <Backdrop>
      {showConfirm && (
        <Confirm
          confirmText="Are you sure?"
          cancelShowConfirm={cancelShowConfirm}
          cartClearHandler={cartClearHandler}
        />
      )}
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
            <span
              onClick={() => {
                setShowConfirm(true);
              }}
            >
              Clear Cart
            </span>
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
