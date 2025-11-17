import Backdrop from '../Backdrop/Backdrop';
import classes from './Confirm.module.css';

const Confirm = ({ confirmText, cancelShowConfirm, cartClearHandler }) => {
  return (
    <Backdrop className={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div>
          <button className={classes.Cancel} onClick={cancelShowConfirm}>
            Cancel
          </button>
          <button className={classes.Ok} onClick={cartClearHandler}>
            Ok
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default Confirm;
