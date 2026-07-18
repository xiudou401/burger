import { ReactNode } from 'react';
import classes from './ProfileStatusBadge.module.css';

type ProfileStatusBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';
type ProfileStatusBadgeSize = 'normal' | 'compact';

interface ProfileStatusBadgeProps {
  children: ReactNode;
  variant?: ProfileStatusBadgeVariant;
  size?: ProfileStatusBadgeSize;
}

const variantClasses: Record<ProfileStatusBadgeVariant, string> = {
  neutral: classes.Neutral,
  success: classes.Success,
  warning: classes.Warning,
  danger: classes.Danger,
};

const sizeClasses: Record<ProfileStatusBadgeSize, string> = {
  normal: classes.Normal,
  compact: classes.Compact,
};

const ProfileStatusBadge = ({
  children,
  variant = 'neutral',
  size = 'normal',
}: ProfileStatusBadgeProps) => {
  return (
    <span
      className={`${classes.Badge} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

export default ProfileStatusBadge;
