import { ButtonHTMLAttributes } from 'react';
import classes from './AdminButton.module.css';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'normal' | 'compact';
  fullWidthOnMobile?: boolean;
}

const AdminButton = ({
  variant = 'primary',
  size = 'normal',
  fullWidthOnMobile = false,
  className,
  ...buttonProps
}: AdminButtonProps) => {
  const classNames = [
    classes.Button,
    classes[variant],
    classes[size],
    fullWidthOnMobile ? classes.FullWidthOnMobile : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={classNames} {...buttonProps} />;
};

export default AdminButton;
