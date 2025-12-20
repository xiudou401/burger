import React, { MouseEvent } from 'react';
import classes from './Confirm.module.css';
import Backdrop from '../Backdrop/Backdrop';

interface ConfirmProps {
  confirmText: string;
  onCancel: () => void;
  onOk: () => void;
}

const Confirm = ({ confirmText, onCancel, onOk }: ConfirmProps) => {
  const cancelHandler = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCancel();
  };
  return (
    <Backdrop className={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div>
          <button className={classes.Cancel} onClick={cancelHandler}>
            Cancel
          </button>
          <button className={classes.Ok} onClick={onOk}>
            Ok
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default Confirm;
