import type { ReactNode } from 'react';
import classes from './BottomActionBar.module.css';

interface BottomActionBarProps {
  summary: ReactNode;
  action: ReactNode;
  variant?: 'cart' | 'checkout';
}

const BottomActionBar = ({
  summary,
  action,
  variant = 'cart',
}: BottomActionBarProps) => {
  return (
    <div className={`${classes.BottomActionBar} ${classes[variant]}`}>
      <div className={classes.Summary}>{summary}</div>
      <div className={classes.Action}>{action}</div>
    </div>
  );
};

export default BottomActionBar;
