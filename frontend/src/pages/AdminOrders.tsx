import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
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
  getOrderStatusVariant,
} from '../utils/order';
import type { Order, OrderStatus } from '../types/order';
import type { AdminOrdersView } from '../api/orders';
import AdminCancelOrderDialog from './AdminCancelOrderDialog';
import KitchenOrderTicket from './KitchenOrderTicket';

const KITCHEN_COLUMNS: Array<{
  title: string;
  status: OrderStatus;
}> = [
  { title: 'New', status: 'confirmed' },
  { title: 'Preparing', status: 'preparing' },
  { title: 'Ready', status: 'ready' },
];

const SECONDARY_ORDER_GROUPS: Array<{
  title: string;
  statuses: OrderStatus[];
}> = [
  { title: 'Awaiting payment', statuses: ['pending_payment'] },
  { title: 'Past orders', statuses: ['completed', 'cancelled'] },
];

const getOrdersByStatus = (orders: Order[], status: OrderStatus) =>
  orders.filter((order) => order.status === status);

const AdminOrders = () => {
  const [activeView, setActiveView] = useState('Kitchen');
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const view: AdminOrdersView =
    activeView === 'Kitchen'
      ? 'kitchen'
      : activeView === 'Awaiting payment'
        ? 'awaiting_payment'
        : 'past';
  const {
    orders,
    isLoading,
    isLoadingMore,
    error,
    updatingOrderIds,
    connectionStatus,
    isOnline,
    hasMoreOrders,
    nextStatuses,
    refresh,
    loadMore,
    changeStatus,
  } = useAdminOrdersPage(view);

  const renderOrderCard = (order: Order, isCompact = false) =>
    !isCompact ? (
      <KitchenOrderTicket
        key={order.id}
        order={order}
        now={now}
        nextStatuses={nextStatuses[order.status]}
        isUpdating={updatingOrderIds.includes(order.id)}
        isOnline={isOnline}
        onAdvance={(status) => {
          void changeStatus(order.id, status, order.version);
        }}
        onCancel={() => setOrderToCancel(order)}
      />
    ) : (
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
            {order.status === 'cancelled' &&
              order.payment?.status === 'paid' && (
                <p className={classes.PaymentWarning}>
                  Paid - arrange refund separately
                </p>
              )}
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
      </article>
    );

  return (
    <AdminLayout
      title="Orders"
      action={
        <div className={classes.PageActions}>
          <span
            role="status"
            className={`${classes.ConnectionStatus} ${connectionStatus === 'live' ? classes.Live : ''}`}
          >
            {connectionStatus === 'live'
              ? 'Live'
              : connectionStatus === 'offline'
                ? 'Offline'
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Reconnecting - polling every 30s'}
          </span>
          <AdminRefreshButton onClick={refresh} />
        </div>
      }
    >
      {orderToCancel && (
        <AdminCancelOrderDialog
          order={orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onConfirm={(reason) => {
            void changeStatus(
              orderToCancel.id,
              'cancelled',
              orderToCancel.version,
              reason,
            );
            setOrderToCancel(null);
          }}
        />
      )}
      {isLoading && <AdminStatusText>Loading orders...</AdminStatusText>}
      {error && <AdminStatusText tone="error">{error}</AdminStatusText>}
      {!isOnline && (
        <AdminStatusText tone="error">
          Offline. Order updates are paused. Displayed orders may be out of
          date.
        </AdminStatusText>
      )}

      {!isLoading && orders.length === 0 && !error && (
        <AdminStatusText>No orders yet.</AdminStatusText>
      )}

      <div className={classes.ViewTabs} role="tablist" aria-label="Order views">
        {['Kitchen', ...SECONDARY_ORDER_GROUPS.map((group) => group.title)].map(
          (title, index, views) => (
            <button
              type="button"
              role="tab"
              id={`order-view-${index}`}
              aria-controls="order-view-panel"
              aria-selected={activeView === title}
              tabIndex={activeView === title ? 0 : -1}
              key={title}
              onClick={() => setActiveView(title)}
              onKeyDown={(event) => {
                const nextIndex =
                  event.key === 'ArrowRight'
                    ? (index + 1) % views.length
                    : event.key === 'ArrowLeft'
                      ? (index + views.length - 1) % views.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? views.length - 1
                          : null;
                if (nextIndex === null) return;
                event.preventDefault();
                setActiveView(views[nextIndex]);
                document.getElementById(`order-view-${nextIndex}`)?.focus();
              }}
            >
              {title}
            </button>
          ),
        )}
      </div>
      <div
        id="order-view-panel"
        role="tabpanel"
        aria-labelledby={`order-view-${['Kitchen', ...SECONDARY_ORDER_GROUPS.map((group) => group.title)].indexOf(activeView)}`}
      >
        {activeView === 'Kitchen' && (
          <div className={classes.Board}>
            {KITCHEN_COLUMNS.map((column) => {
              const columnOrders = getOrdersByStatus(orders, column.status);

              return (
                <section className={classes.Lane} key={column.status}>
                  <div className={classes.LaneHeader}>
                    <h2 className={classes.LaneTitle}>{column.title}</h2>
                    <span className={classes.LaneCount}>
                      {columnOrders.length}
                    </span>
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
        )}

        {SECONDARY_ORDER_GROUPS.map((group) => {
          if (activeView !== group.title) return null;
          const groupOrders = orders.filter((order) =>
            group.statuses.includes(order.status),
          );
          return (
            <section className={classes.RecentSection} key={group.title}>
              <div className={classes.RecentHeader}>
                <h2 className={classes.RecentTitle}>{group.title}</h2>
                <span className={classes.LaneCount}>{groupOrders.length}</span>
              </div>
              <div className={classes.RecentGrid}>
                {groupOrders.map((order) => renderOrderCard(order, true))}
                {groupOrders.length === 0 && (
                  <AdminStatusText>No orders in this view.</AdminStatusText>
                )}
              </div>
            </section>
          );
        })}

        <AdminLoadMore
          hasMore={hasMoreOrders}
          isLoading={isLoadingMore}
          onLoadMore={loadMore}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
