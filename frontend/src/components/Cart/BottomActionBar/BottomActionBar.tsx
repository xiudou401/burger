import type { ReactNode } from 'react';
import classes from './BottomActionBar.module.css';

interface BottomActionBarProps {
  summary: ReactNode;
  action: ReactNode;
  variant?: 'cart' | 'checkout';
  isEmpty?: boolean;
}

const BottomActionBar = ({
  summary,
  action,
  variant = 'cart',
  isEmpty = false,
}: BottomActionBarProps) => {
  const className = [
    classes.BottomActionBar,
    classes[variant],
    isEmpty ? classes.Empty : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <div className={classes.Summary}>{summary}</div>
      <div className={classes.Action}>{action}</div>
    </div>
  );
};

export default BottomActionBar;
