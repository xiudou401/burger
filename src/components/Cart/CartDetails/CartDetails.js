import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import MealItem from '../../Meals/Meal/MealItem';
import { useContext, useState } from 'react';
import { CartContext } from '../../../store/CartContext';
import Confirm from '../../UI/Confirm/Confirm';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);
  const [showConfirm, setShowConfirm] = useState(false);

  const onCancel = () => {
    setShowConfirm(false);
  };

  const okHandler = () => {
    cartCtx.cartDispatch({ type: 'CLEAR' });
  };
  return (
    <Backdrop>
      {showConfirm && (
        <Confirm
          onCancel={onCancel}
          onOk={okHandler}
          confirmText={'Are you sure to clear the cart?'}
        />
      )}
      <div className={classes.CartDetails} onClick={(e) => e.stopPropagation()}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear}>
            <FontAwesomeIcon icon={faTrash} />
            <span
              onClick={() => {
                setShowConfirm(true);
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
