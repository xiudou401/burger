import { Link, NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { hasPermission } from '../../types/permissions';
import classes from './AdminLayout.module.css';

interface AdminLayoutProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}

const AdminLayout = ({
  title,
  eyebrow = 'Admin',
  action,
  children,
}: AdminLayoutProps) => {
  const user = useAuth((ctx) => ctx.user);
  const logout = useAuth((ctx) => ctx.logout);
  const canViewOrders = hasPermission(user, 'view_orders');
  const canManageMenu = hasPermission(user, 'manage_menu');
  const canManageStaff = hasPermission(user, 'manage_staff');
  const canManageCustomers = hasPermission(user, 'manage_customers');

  return (
    <main className={classes.Page}>
      <aside className={classes.Sidebar}>
        <Link className={classes.Brand} to="/admin/dashboard">
          <span className={classes.Mark}>B</span>
          <span>Kitchen Console</span>
        </Link>

        <nav className={classes.Nav} aria-label="Admin">
          {canViewOrders && (
            <>
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? `${classes.NavLink} ${classes.NavLinkActive}`
                    : classes.NavLink
                }
                to="/admin/dashboard"
              >
                Dashboard
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? `${classes.NavLink} ${classes.NavLinkActive}`
                    : classes.NavLink
                }
                to="/admin/orders"
              >
                Orders
              </NavLink>
            </>
          )}
          {canManageMenu && (
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? `${classes.NavLink} ${classes.NavLinkActive}`
                  : classes.NavLink
              }
              to="/admin/menu"
            >
              Menu
            </NavLink>
          )}
          {canManageStaff && (
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? `${classes.NavLink} ${classes.NavLinkActive}`
                  : classes.NavLink
              }
              to="/admin/staff"
            >
              Staff
            </NavLink>
          )}
          {canManageCustomers && (
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? `${classes.NavLink} ${classes.NavLinkActive}`
                  : classes.NavLink
              }
              to="/admin/customers"
            >
              Customers
            </NavLink>
          )}
        </nav>
      </aside>

      <section className={classes.Content}>
        <header className={classes.Topbar}>
          <div>
            <p className={classes.Eyebrow}>{eyebrow}</p>
            <h1 className={classes.Title}>{title}</h1>
          </div>
          <div className={classes.UserArea}>
            <span className={classes.UserName}>{user?.name ?? 'Admin'}</span>
            <button className={classes.Logout} type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {action && <div className={classes.ActionBar}>{action}</div>}

        {children}
      </section>
    </main>
  );
};

export default AdminLayout;
