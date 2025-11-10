import { useContext } from 'react';
import Backdrop from '../Backdrop/Backdrop';
import classes from './Confirm.module.css';
import { CartContext } from '../../../store/CartContext';

const Confirm = ({ confirmText, onCancel }) => {
  const cartCtx = useContext(CartContext);
  return (
    <Backdrop className={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div>
          <button
            className={classes.Cancel}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            className={classes.Ok}
            onClick={() => {
              cartCtx.cartDispatch({ type: 'CLEAR' });
            }}
          >
            Ok
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default Confirm;
