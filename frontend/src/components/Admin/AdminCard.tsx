import { HTMLAttributes } from 'react';
import classes from './AdminCard.module.css';

interface AdminCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
}

const AdminCard = ({
  as: Component = 'section',
  className,
  children,
  ...props
}: AdminCardProps) => {
  const classNames = [classes.Card, className ?? ''].filter(Boolean).join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};

export default AdminCard;
