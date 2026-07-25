import React, { MouseEvent } from 'react';
import classes from './Confirm.module.css';
import Backdrop from '../Backdrop/Backdrop';

interface ConfirmProps {
  confirmText: string;
  cancelLabel?: string;
  okLabel?: string;
  onCancel: () => void;
  onOk: () => void;
}

const Confirm = ({
  confirmText,
  cancelLabel = 'Cancel',
  okLabel = 'Ok',
  onCancel,
  onOk,
}: ConfirmProps) => {
  const cancelHandler = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCancel();
  };

  const okHandler = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOk();
  };

  return (
    <Backdrop className={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div className={classes.Actions}>
          <button
            type="button"
            className={classes.Cancel}
            onClick={cancelHandler}
          >
            {cancelLabel}
          </button>
          <button type="button" className={classes.Ok} onClick={okHandler}>
            {okLabel}
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default Confirm;
