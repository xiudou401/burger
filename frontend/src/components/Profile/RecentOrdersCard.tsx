import { Link } from 'react-router-dom';
import classes from './RecentOrdersCard.module.css';
import type { Order } from '../../types/order';

interface RecentOrdersCardProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const summarizeItems = (order: Order) => {
  return order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
};

const RecentOrdersCard = ({
  orders,
  isLoading,
  error,
}: RecentOrdersCardProps) => {
  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Recent orders</h2>
      </div>

      {isLoading && <p className={classes.OrderText}>Loading orders...</p>}

      {error && <p className={classes.Error}>{error}</p>}

      {!isLoading && !error && orders.length === 0 && (
        <div className={classes.OrderTile}>
          <div className={classes.OrderIcon}>0</div>
          <p className={classes.OrderText}>
            Your completed orders will appear here after checkout.
          </p>
          <div className={classes.Actions}>
            <Link className={classes.SecondaryAction} to="/">
              Start an order
            </Link>
          </div>
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <div className={classes.OrderList}>
          {orders.map((order) => (
            <Link
              className={classes.OrderRow}
              key={order.id}
              to={`/orders/${order.id}`}
            >
              <div>
                <div className={classes.OrderMeta}>
                  <span>{formatDate(order.createdAt)}</span>
                  <span className={classes.Status}>{order.status}</span>
                </div>
                <p className={classes.OrderSummary}>{summarizeItems(order)}</p>
              </div>
              <strong className={classes.OrderTotal}>
                ￥{order.total.toFixed(2)}
              </strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentOrdersCard;
