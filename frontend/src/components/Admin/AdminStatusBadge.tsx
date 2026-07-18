import { ReactNode } from 'react';
import classes from './AdminStatusBadge.module.css';

export type AdminStatusBadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger';

interface AdminStatusBadgeProps {
  children: ReactNode;
  variant?: AdminStatusBadgeVariant;
}

const variantClasses: Record<AdminStatusBadgeVariant, string> = {
  neutral: classes.Neutral,
  success: classes.Success,
  warning: classes.Warning,
  danger: classes.Danger,
};

const AdminStatusBadge = ({
  children,
  variant = 'neutral',
}: AdminStatusBadgeProps) => {
  return (
    <span className={`${classes.Badge} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export default AdminStatusBadge;
