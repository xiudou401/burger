import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { hasPermission } from '../../types/permissions';
import AccountBar from '../Auth/AccountBar';
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
      <AccountBar
        variant="admin"
        title="Kitchen Console"
        to="/admin/dashboard"
        showVerifyButton={false}
      />

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
