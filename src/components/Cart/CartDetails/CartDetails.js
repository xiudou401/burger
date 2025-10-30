import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import MealItem from '../../Meals/Meal/MealItem';
import { useContext } from 'react';
import { CartContext } from '../../../store/CartContext';

const CartDetails = () => {
  const cartCtx = useContext(CartContext);
  const handleDetailsClick = (e) => {
    e.stopPropagation();
  };

  return (
    <Backdrop onClick={handleDetailsClick}>
      <div className={classes.CartDetails}>
        <header className={classes.Header}>
          <h2 className={classes.Title}>Cart Details</h2>
          <div className={classes.Clear}>
            <FontAwesomeIcon icon={faTrash} />
            <span>Clear Cart</span>
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
