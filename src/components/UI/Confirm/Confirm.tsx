import React from 'react';
import Backdrop from '../Backdrop/Backdrop';
import classes from './Confirm.module.css';

interface ConfirmProps {
  confirmText: string;
  onCancel: () => void;
  onOk: () => void;
}

const Confirm: React.FC<ConfirmProps> = ({ confirmText, onCancel, onOk }) => {
  return (
    <Backdrop className={classes.ConfirmOuter}>
      <div className={classes.Confirm}>
        <p className={classes.ConfirmText}>{confirmText}</p>
        <div>
          <button className={classes.Cancel} onClick={onCancel}>
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
