import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Backdrop from '../../UI/Backdrop/Backdrop';
import classes from './CartDetails.module.css';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useContext, useState } from 'react';
import { CartContext } from '../../../store/CartContext';
import MealItem from '../../Meals/Meal/MealItem';
import Confirm from '../../UI/Confirm/Confirm';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);
  const [showConfirm, setShowConfirm] = useState(false);

  const onCancel = () => {
    setShowConfirm(false);
  };
  const onOk = () => {
    cartCtx.cartDispatch({ type: 'CLEAR' });
  };
  return (
    <Backdrop>
      <div
        className={classes.CartDetails}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {showConfirm && (
          <Confirm
            confirmText="Are you sure?"
            onCancel={onCancel}
            onOk={onOk}
          />
        )}
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div
            className={classes.Clear}
            onClick={() => {
              setShowConfirm(true);
            }}
          >
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
