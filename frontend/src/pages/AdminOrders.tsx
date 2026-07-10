import { Link } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import classes from './AdminOrders.module.css';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import { formatCurrency } from '../utils/currency';

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const summarizeItems = (items: { name: string; quantity: number }[]) => {
  return items
    .slice(0, 3)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
};

const AdminOrders = () => {
  const {
    orders,
    isLoading,
    error,
    updatingOrderId,
    nextStatuses,
    refresh,
    changeStatus,
  } = useAdminOrdersPage();

  return (
    <AdminLayout
      title="Orders"
      action={
        <button
          className={classes.RefreshButton}
          type="button"
          onClick={refresh}
        >
          Refresh
        </button>
      }
    >
      {isLoading && <p className={classes.StateText}>Loading orders...</p>}
      {error && <p className={classes.Error}>{error}</p>}

      {!isLoading && orders.length === 0 && !error && (
        <p className={classes.StateText}>No orders yet.</p>
      )}

      <div className={classes.OrderList}>
        {orders.map((order) => (
          <article className={classes.OrderCard} key={order.id}>
            <div className={classes.OrderTop}>
              <div>
                <Link
                  className={classes.OrderId}
                  to={`/admin/orders/${order.id}`}
                >
                  #{order.id.slice(-6).toUpperCase()}
                </Link>
                <p className={classes.OrderDate}>
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span className={classes.Status}>{order.status}</span>
            </div>

            <p className={classes.Summary}>{summarizeItems(order.items)}</p>

            <div className={classes.OrderBottom}>
              <strong className={classes.Total}>
                {formatCurrency(order.totalCents)}
              </strong>
              <div className={classes.Actions}>
                {nextStatuses[order.status].map((status) => (
                  <button
                    className={classes.ActionButton}
                    disabled={updatingOrderId === order.id}
                    key={status}
                    type="button"
                    onClick={() =>
                      changeStatus(order.id, status, order.version)
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
