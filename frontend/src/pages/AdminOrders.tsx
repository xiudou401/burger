import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminLoadMore from '../components/Admin/AdminLoadMore';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusBadge from '../components/Admin/AdminStatusBadge';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './AdminOrders.module.css';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import { formatCurrency } from '../utils/currency';
import {
  formatOrderDay,
  orderDayKey,
  orderDateRange,
  formatOrderDateTime,
} from '../utils/order-date';
import {
  formatOrderShortId,
  getAdminOrderPaymentNotice,
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
}> = [{ title: 'Order history' }];

const getOrdersByStatus = (orders: Order[], status: OrderStatus) =>
  orders.filter((order) => order.status === status);

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const appliedSearch = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(appliedSearch);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    setSearchInput(appliedSearch);
    setSearchError('');
  }, [appliedSearch]);
  const selectedView = searchParams.get('view');
  const historyState =
    selectedView === 'awaiting_payment' ||
    searchParams.get('state') === 'pending_payment'
      ? 'pending_payment'
      : searchParams.get('state') === 'cancelled'
        ? 'cancelled'
        : 'completed';
  const activeView =
    selectedView === 'past' || selectedView === 'awaiting_payment'
      ? 'Order history'
      : 'Kitchen';
  const setActiveView = (title: string) => {
    setSearchParams((current) => {
      current.delete('search');
      current.set('view', title === 'Order history' ? 'past' : 'kitchen');
      if (selectedView === 'awaiting_payment')
        current.set('state', 'pending_payment');
      return current;
    });
  };
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now);
  const today = orderDayKey(now)!;
  const appliedFrom = searchParams.get('from') || today;
  const appliedThrough = searchParams.get('through') || today;
  const [fromDate, setFromDate] = useState(appliedFrom);
  const [throughDate, setThroughDate] = useState(appliedThrough);
  let dateRange = orderDateRange(today, today);
  try {
    dateRange = orderDateRange(appliedFrom, appliedThrough);
  } catch {
    /* Invalid URL dates must not turn history into an unbounded query. */
  }
  const applyDateFilters = (clear = false) => {
    setSearchParams((current) => {
      if (!clear && fromDate) current.set('from', fromDate);
      else current.delete('from');
      if (!clear && throughDate) current.set('through', throughDate);
      else current.delete('through');
      return current;
    });
  };
  const [dateError, setDateError] = useState('');
  useEffect(() => {
    setFromDate(appliedFrom);
    setThroughDate(appliedThrough);
    setDateError('');
  }, [appliedFrom, appliedThrough]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const view: AdminOrdersView = appliedSearch
    ? 'all'
    : activeView === 'Kitchen'
      ? 'kitchen'
      : historyState === 'pending_payment'
        ? 'awaiting_payment'
        : historyState;
  const {
    orders,
    isLoading,
    isLoadingMore,
    error,
    hasUpdates,
    updatingOrderIds,
    connectionStatus,
    isOnline,
    hasMoreOrders,
    nextStatuses,
    refresh,
    loadMore,
    changeStatus,
  } = useAdminOrdersPage(
    view,
    appliedSearch
      ? { search: appliedSearch }
      : activeView === 'Order history'
        ? dateRange
        : {},
  );

  const renderOrderCard = (order: Order, isCompact = false) => {
    const paymentNotice = getAdminOrderPaymentNotice(order, now);
    return !isCompact ? (
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
                state={{ ordersReturnTo: location.pathname + location.search }}
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
              Placed{' '}
              <time
                dateTime={
                  orderDayKey(order.createdAt) ? order.createdAt : undefined
                }
              >
                {formatOrderDateTime(order.createdAt, 'Order time unavailable')}
              </time>
            </p>
            {paymentNotice && (
              <p className={classes.PaymentWarning}>{paymentNotice}</p>
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
  };

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
      {hasUpdates && (
        <AdminStatusText>
          Orders may have changed. Refresh to load the latest orders.
        </AdminStatusText>
      )}
      {!isOnline && (
        <AdminStatusText tone="error">
          Offline. Order updates are paused. Displayed orders may be out of
          date.
        </AdminStatusText>
      )}

      {!isLoading && orders.length === 0 && !error && (
        <AdminStatusText>
          {appliedSearch
            ? 'No matching orders found.'
            : activeView === 'Order history' && (dateRange.from || dateRange.to)
              ? 'No orders match the selected dates.'
              : 'No orders yet.'}
        </AdminStatusText>
      )}

      <form
        className={classes.OrderSearch}
        role="search"
        aria-label="Order search"
        onSubmit={(event) => {
          event.preventDefault();
          const search = searchInput.trim().replace(/^#/, '').toLowerCase();
          if (!/^(?:[a-f0-9]{6}|[a-f0-9]{24})$/.test(search)) {
            setSearchError(
              'Enter a 6-character or full 24-character order number.',
            );
            return;
          }
          setSearchError('');
          setSearchParams((current) => {
            current.set('search', search);
            return current;
          });
        }}
      >
        <label htmlFor="order-number-search">Order number</label>
        <div className={classes.SearchControls}>
          <input
            id="order-number-search"
            type="search"
            value={searchInput}
            maxLength={25}
            placeholder="#2A094D"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(searchError)}
            aria-describedby={searchError ? 'order-search-error' : undefined}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setSearchError('');
            }}
          />
          <button
            type="submit"
            aria-label="Search orders"
            title="Search orders"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          {(appliedSearch || searchInput) && (
            <button
              type="button"
              aria-label="Clear order search"
              title="Clear order search"
              onClick={() => {
                setSearchInput('');
                setSearchError('');
                setSearchParams((current) => {
                  current.delete('search');
                  return current;
                });
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
        {searchError && (
          <p id="order-search-error" role="alert">
            {searchError}
          </p>
        )}
      </form>
      {!appliedSearch && (
        <div
          className={classes.ViewTabs}
          role="tablist"
          aria-label="Order views"
        >
          {[
            'Kitchen',
            ...SECONDARY_ORDER_GROUPS.map((group) => group.title),
          ].map((title, index, views) => (
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
          ))}
        </div>
      )}
      <div
        id="order-view-panel"
        role={appliedSearch ? 'region' : 'tabpanel'}
        aria-label={appliedSearch ? 'Order search results' : undefined}
        aria-labelledby={
          appliedSearch
            ? undefined
            : `order-view-${['Kitchen', ...SECONDARY_ORDER_GROUPS.map((group) => group.title)].indexOf(activeView)}`
        }
      >
        {appliedSearch && (
          <section className={classes.RecentSection}>
            <div className={classes.RecentHeader}>
              <h2 className={classes.RecentTitle}>
                Results for #{appliedSearch.toUpperCase()}
              </h2>
            </div>
            <div className={classes.RecentGrid}>
              {orders.map((order) => renderOrderCard(order, true))}
            </div>
          </section>
        )}
        {!appliedSearch && activeView === 'Order history' && (
          <div className={classes.HistoryState}>
            <label htmlFor="history-order-state">Order status</label>
            <select
              id="history-order-state"
              value={historyState}
              onChange={(event) => {
                const state = event.target.value;
                setSearchParams((current) => {
                  current.set('view', 'past');
                  if (state !== 'completed') current.set('state', state);
                  else current.delete('state');
                  return current;
                });
              }}
            >
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_payment">Awaiting payment</option>
            </select>
          </div>
        )}
        {!appliedSearch && activeView === 'Order history' && (
          <details
            className={classes.HistoryDates}
            open={
              searchParams.has('from') || searchParams.has('through')
                ? true
                : undefined
            }
          >
            <summary>
              {appliedFrom === today && appliedThrough === today
                ? 'Today'
                : `${appliedFrom} to ${appliedThrough}`}
            </summary>
            <form
              className={classes.DateFilters}
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  if (!fromDate || !throughDate)
                    throw new Error(
                      'Choose both a start date and an end date.',
                    );
                  orderDateRange(fromDate, throughDate);
                  applyDateFilters();
                  setDateError('');
                } catch (err) {
                  setDateError(
                    err instanceof Error
                      ? err.message
                      : 'Choose valid order dates.',
                  );
                }
              }}
            >
              <label>
                From date
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </label>
              <label>
                To date
                <input
                  type="date"
                  value={throughDate}
                  onChange={(event) => setThroughDate(event.target.value)}
                />
              </label>
              <button type="submit">Apply dates</button>
              <button
                type="button"
                onClick={() => {
                  setFromDate(today);
                  setThroughDate(today);
                  applyDateFilters(true);
                  setDateError('');
                }}
              >
                Today
              </button>
              {dateError && <p role="alert">{dateError}</p>}
            </form>
          </details>
        )}
        {!appliedSearch && activeView === 'Kitchen' && (
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
          if (appliedSearch || activeView !== group.title) return null;
          const groupOrders = orders.filter(
            (order) => order.status === historyState,
          );
          const days = new Map<string, Order[]>();
          for (const order of groupOrders) {
            const key = orderDayKey(order.createdAt) ?? 'unknown';
            days.set(key, [...(days.get(key) ?? []), order]);
          }
          return (
            <section className={classes.RecentSection} key={group.title}>
              <div className={classes.RecentHeader}>
                <h2 className={classes.RecentTitle}>{group.title}</h2>
                <span className={classes.LaneCount}>{groupOrders.length}</span>
              </div>
              {view !== 'awaiting_payment' ? (
                [...days].map(([key, dayOrders]) => (
                  <section className={classes.DayGroup} key={key}>
                    <h3>
                      <time dateTime={key === 'unknown' ? undefined : key}>
                        {formatOrderDay(dayOrders[0].createdAt, now)}
                      </time>
                    </h3>
                    <div className={classes.RecentGrid}>
                      {dayOrders.map((order) => renderOrderCard(order, true))}
                    </div>
                  </section>
                ))
              ) : (
                <div className={classes.RecentGrid}>
                  {groupOrders.map((order) => renderOrderCard(order, true))}
                </div>
              )}
              <div>
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
