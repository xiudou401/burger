import Backdrop from '../Backdrop/Backdrop';
import classes from './Confirm.module.css';

const Confirm = ({ confirmText, onCancel, onOk }) => {
  return (
    <Backdrop classes={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div>
          <button
            className={classes.Cancel}
            onClick={(e) => {
              e.stopPropagation();
              onCancel(e);
            }}
          >
            Cancel
          </button>
          <button
            className={classes.Ok}
            onClick={(e) => {
              onOk(e);
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
