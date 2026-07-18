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
  summarizeOrderItems,
} from '../utils/order';

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
            </div>

            <p className={classes.Summary}>
              {summarizeOrderItems(order.items, { limit: 3 })}
            </p>

            <div className={classes.OrderBottom}>
              <strong className={classes.Total}>
                {formatCurrency(order.totalCents)}
              </strong>
              <div className={classes.Actions}>
                {nextStatuses[order.status].map((status) => (
                  <AdminButton
                    variant={status === 'cancelled' ? 'danger' : 'primary'}
                    size="compact"
                    disabled={updatingOrderId === order.id}
                    key={status}
                    type="button"
                    onClick={() =>
                      changeStatus(order.id, status, order.version)
                    }
                  >
                    {getOrderActionLabel(order.status, status)}
                  </AdminButton>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <AdminLoadMore
        hasMore={hasMoreOrders}
        isLoading={isLoadingMore}
        onLoadMore={loadMore}
      />
    </AdminLayout>
  );
};

export default AdminOrders;
