import { Link, NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { hasPermission } from '../../types/permissions';
import AccountControls from '../Auth/AccountControls';
import classes from './AdminLayout.module.css';

interface AdminLayoutProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

const AdminLayout = ({ title, action, children }: AdminLayoutProps) => {
  const user = useAuth((ctx) => ctx.user);
  const canViewOrders = hasPermission(user, 'view_orders');
  const canManageMenu = hasPermission(user, 'manage_menu');
  const canManageStaff = hasPermission(user, 'manage_staff');
  const canManageCustomers = hasPermission(user, 'manage_customers');
  const navItems = [
    ...(canViewOrders
      ? [
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Orders', to: '/admin/orders' },
        ]
      : []),
    ...(canManageMenu ? [{ label: 'Menu', to: '/admin/menu' }] : []),
    ...(canManageStaff ? [{ label: 'Staff', to: '/admin/staff' }] : []),
    ...(canManageCustomers
      ? [{ label: 'Customers', to: '/admin/customers' }]
      : []),
  ];

  return (
    <main className={classes.Page}>
      <header className={classes.AppBar}>
        <Link className={classes.Brand} to="/admin/dashboard">
          <span className={classes.Mark}>S</span>
          <span>Kitchen Console</span>
        </Link>

        <AccountControls variant="admin" showVerifyButton={false} />
      </header>

      <nav className={classes.NavRail} aria-label="Admin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              isActive
                ? `${classes.NavLink} ${classes.NavLinkActive}`
                : classes.NavLink
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <section className={classes.Content}>
        <header className={classes.Topbar}>
          <div>
            <h1 className={classes.Title}>{title}</h1>
          </div>
          {action && <div className={classes.ActionBar}>{action}</div>}
        </header>

        {children}
      </section>
    </main>
  );
};

export default AdminLayout;
