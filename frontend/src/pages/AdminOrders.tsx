import { Link } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import classes from './AdminOrders.module.css';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import { formatCurrency } from '../utils/currency';
import type { OrderStatus } from '../types/order';

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

const getStatusClassName = (status: OrderStatus) => {
  return `${classes.Status} ${classes[`Status-${status}`]}`;
};

const ACTION_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Mark pending',
  paid: 'Mark paid',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  completed: 'Complete order',
  cancelled: 'Cancel order',
};

const getActionLabel = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) => {
  if (currentStatus === 'pending_payment' && nextStatus === 'cancelled') {
    return 'Cancel pending order';
  }

  return ACTION_LABELS[nextStatus];
};

const getActionClassName = (nextStatus: OrderStatus) => {
  return nextStatus === 'cancelled'
    ? `${classes.ActionButton} ${classes.CancelActionButton}`
    : classes.ActionButton;
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
      action={<AdminRefreshButton onClick={refresh} />}
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
                <div className={classes.OrderMetaLine}>
                  <Link
                    className={classes.OrderId}
                    to={`/admin/orders/${order.id}`}
                  >
                    #{order.id.slice(-6).toUpperCase()}
                  </Link>
                  <span className={getStatusClassName(order.status)}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p className={classes.OrderDate}>
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <p className={classes.Summary}>{summarizeItems(order.items)}</p>

            <div className={classes.OrderBottom}>
              <strong className={classes.Total}>
                {formatCurrency(order.totalCents)}
              </strong>
              <div className={classes.Actions}>
                {nextStatuses[order.status].map((status) => (
                  <button
                    className={getActionClassName(status)}
                    disabled={updatingOrderId === order.id}
                    key={status}
                    type="button"
                    onClick={() =>
                      changeStatus(order.id, status, order.version)
                    }
                  >
                    {getActionLabel(order.status, status)}
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
