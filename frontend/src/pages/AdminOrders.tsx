import { Link } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminLoadMore from '../components/Admin/AdminLoadMore';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusBadge from '../components/Admin/AdminStatusBadge';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './AdminOrders.module.css';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import { formatCurrency } from '../utils/currency';
import { formatShortDateTime } from '../utils/date';
import {
  formatOrderShortId,
  formatOrderStatus,
  getOrderActionLabel,
  getOrderStatusVariant,
} from '../utils/order';
import type { Order, OrderStatus } from '../types/order';

const KITCHEN_COLUMNS: Array<{
  title: string;
  status: OrderStatus;
}> = [
  { title: 'New', status: 'paid' },
  { title: 'Preparing', status: 'preparing' },
  { title: 'Ready', status: 'ready' },
];

const RECENT_STATUSES: OrderStatus[] = [
  'pending_payment',
  'completed',
  'cancelled',
];

const getOrdersByStatus = (orders: Order[], status: OrderStatus) =>
  orders.filter((order) => order.status === status);

const AdminOrders = () => {
  const {
    orders,
    isLoading,
    isLoadingMore,
    error,
    updatingOrderId,
    hasMoreOrders,
    nextStatuses,
    refresh,
    loadMore,
    changeStatus,
  } = useAdminOrdersPage();

  const recentOrders = orders.filter((order) =>
    RECENT_STATUSES.includes(order.status),
  );

  const renderOrderCard = (order: Order, isCompact = false) => (
    <article className={classes.OrderCard} key={order.id}>
      <div className={classes.OrderTop}>
        <div>
          <div className={classes.OrderMetaLine}>
            <Link className={classes.OrderId} to={`/admin/orders/${order.id}`}>
              #{formatOrderShortId(order.id)}
            </Link>
            <AdminStatusBadge
              variant={getOrderStatusVariant(order.status, {
                completedVariant: 'neutral',
              })}
            >
              {formatOrderStatus(order.status)}
            </AdminStatusBadge>
          </div>
          <p className={classes.OrderDate}>
            {formatShortDateTime(order.createdAt)}
          </p>
        </div>
        <strong className={classes.Total}>
          {formatCurrency(order.totalCents)}
        </strong>
      </div>

      <ul className={classes.ItemList}>
        {order.items.map((item) => (
          <li className={classes.ItemLine} key={item.menuItemId}>
            <span className={classes.ItemQuantity}>{item.quantity}x</span>
            <span className={classes.ItemName}>{item.name}</span>
          </li>
        ))}
      </ul>

      {!isCompact && nextStatuses[order.status].length > 0 && (
        <div className={classes.Actions}>
          {nextStatuses[order.status].map((status) => (
            <AdminButton
              variant={status === 'cancelled' ? 'danger' : 'primary'}
              size="compact"
              disabled={updatingOrderId === order.id}
              key={status}
              type="button"
              onClick={() =>
                changeStatus(
                  order.id,
                  status,
                  order.version,
                  status === 'cancelled' ? 'staff_cancelled' : undefined,
                )
              }
            >
              {getOrderActionLabel(order.status, status)}
            </AdminButton>
          ))}
        </div>
      )}
    </article>
  );

  return (
    <AdminLayout
      title="Orders"
      action={<AdminRefreshButton onClick={refresh} />}
    >
      {isLoading && <AdminStatusText>Loading orders...</AdminStatusText>}
      {error && <AdminStatusText tone="error">{error}</AdminStatusText>}

      {!isLoading && orders.length === 0 && !error && (
        <AdminStatusText>No orders yet.</AdminStatusText>
      )}

      <div className={classes.Board}>
        {KITCHEN_COLUMNS.map((column) => {
          const columnOrders = getOrdersByStatus(orders, column.status);

          return (
            <section className={classes.Lane} key={column.status}>
              <div className={classes.LaneHeader}>
                <h2 className={classes.LaneTitle}>{column.title}</h2>
                <span className={classes.LaneCount}>{columnOrders.length}</span>
              </div>

              <div className={classes.LaneBody}>
                {columnOrders.length > 0 ? (
                  columnOrders.map((order) => renderOrderCard(order))
                ) : (
                  <p className={classes.EmptyLane}>Clear</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {recentOrders.length > 0 && (
        <section className={classes.RecentSection}>
          <div className={classes.RecentHeader}>
            <h2 className={classes.RecentTitle}>Recent orders</h2>
            <span className={classes.LaneCount}>{recentOrders.length}</span>
          </div>
          <div className={classes.RecentGrid}>
            {recentOrders.map((order) => renderOrderCard(order, true))}
          </div>
        </section>
      )}

      <AdminLoadMore
        hasMore={hasMoreOrders}
        isLoading={isLoadingMore}
        onLoadMore={loadMore}
      />
    </AdminLayout>
  );
};

export default AdminOrders;
