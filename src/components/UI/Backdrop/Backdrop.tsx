import ReactDOM from 'react-dom';
import classes from './Backdrop.module.css';
import React, { PropsWithChildren } from 'react';

const backdropRoot = document.getElementById('backdrop-root')!;
interface BackdropProps {
  className?: string;
}
const Backdrop: React.FC<PropsWithChildren<BackdropProps>> = (props) => {
  return ReactDOM.createPortal(
    <div className={`${classes.Backdrop} ${props.className || ''}`}>
      {props.children}
    </div>,
    backdropRoot
  );
};

export default Backdrop;
