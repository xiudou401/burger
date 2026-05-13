import { ReactNode } from 'react';
import classes from './MenuLayout.module.css';

interface MenuLayoutProps {
  children: ReactNode;
}

const MenuLayout = ({ children }: MenuLayoutProps) => {
  return <div className={classes.MenuLayout}>{children}</div>;
};

export default MenuLayout;
