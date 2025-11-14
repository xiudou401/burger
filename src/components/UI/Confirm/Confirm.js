import Backdrop from '../Backdrop/Backdrop';
import classes from './Confirm.module.css';

const Confirm = ({ hideClearCartHandler, clearCartHandler, confirmText }) => {
  return (
    <Backdrop className={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div>
          <button className={classes.Cancel} onClick={hideClearCartHandler}>
            Cancel
          </button>
          <button className={classes.Ok} onClick={clearCartHandler}>
            Ok
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default Confirm;
