import AdminLayout from '../components/Admin/AdminLayout';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import classes from './AdminDashboard.module.css';
import { useAdminDashboardPage } from './hooks/useAdminDashboardPage';
import { formatCurrency } from '../utils/currency';
import type { OrderStatus } from '../types/order';

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const formatMinutes = (value: number | null) =>
  value === null ? 'N/A' : `${value} min`;

const AdminDashboard = () => {
  const { summary, isLoading, error, refresh } = useAdminDashboardPage();

  return (
    <AdminLayout
      title="Dashboard"
      action={<AdminRefreshButton onClick={refresh} />}
    >
      {isLoading && <p className={classes.StateText}>Loading dashboard...</p>}
      {error && <p className={classes.Error}>{error}</p>}

      {!isLoading && !error && summary && (
        <>
          <section className={classes.MetricGrid} aria-label="Today metrics">
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Today revenue</p>
              <p className={classes.MetricValue}>
                {formatCurrency(summary.todayRevenueCents)}
              </p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Today orders</p>
              <p className={classes.MetricValue}>{summary.todayOrderCount}</p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Active orders</p>
              <p className={classes.MetricValue}>{summary.activeOrders}</p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Avg prep time</p>
              <p className={classes.MetricValue}>
                {formatMinutes(summary.averagePreparationMinutes)}
              </p>
            </article>
          </section>

          <section className={classes.PanelGrid}>
            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Orders by status</h2>
              <div className={classes.StatusGrid}>
                {ORDER_STATUSES.map((status) => (
                  <div className={classes.StatusRow} key={status}>
                    <span className={classes.StatusName}>
                      {status.replace('_', ' ')}
                    </span>
                    <span className={classes.StatusCount}>
                      {summary.ordersByStatus[status]}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Top selling items</h2>
              {summary.topItems.length === 0 ? (
                <p className={classes.EmptyText}>No paid orders yet today.</p>
              ) : (
                <div className={classes.TopItems}>
                  {summary.topItems.map((item) => (
                    <div className={classes.TopItem} key={item.menuItemId}>
                      <span className={classes.ItemName}>{item.name}</span>
                      <span className={classes.ItemMeta}>
                        {item.quantitySold} sold ·{' '}
                        {formatCurrency(item.revenueCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
