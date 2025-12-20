import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import classes from './Backdrop.module.css';

interface BackdropProps {
  children: ReactNode;
  className?: string;
}

const Backdrop = ({ children, className }: BackdropProps) => {
  const backdropRoot = document.getElementById('backdrop-root')!;
  if (!backdropRoot) return null;

  return ReactDOM.createPortal(
    <div className={`${classes.Backdrop} ${className}`}>{children}</div>,
    backdropRoot
  );
};

export default Backdrop;
