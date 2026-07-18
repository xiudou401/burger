import { Link } from 'react-router-dom';
import classes from './RecentOrdersCard.module.css';
import type { Order } from '../../types/order';
import { formatCurrency } from '../../utils/currency';
import { formatShortDateTime } from '../../utils/date';
import {
  formatOrderStatus,
  getOrderStatusVariant,
  summarizeOrderItems,
} from '../../utils/order';
import ProfileStatusBadge from './ProfileStatusBadge';

interface RecentOrdersCardProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

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
                  <span>{formatShortDateTime(order.createdAt)}</span>
                  <ProfileStatusBadge
                    variant={getOrderStatusVariant(order.status)}
                    size="compact"
                  >
                    {formatOrderStatus(order.status)}
                  </ProfileStatusBadge>
                </div>
                <p className={classes.OrderSummary}>
                  {summarizeOrderItems(order.items, { limit: 2 })}
                </p>
              </div>
              <strong className={classes.OrderTotal}>
                {formatCurrency(order.totalCents)}
              </strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentOrdersCard;
