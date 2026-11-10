import { Link, useLocation, useParams } from 'react-router-dom';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './OrderDetails.module.css';
import { useAdminOrderDetailsPage } from './hooks/useAdminOrderDetailsPage';
import { formatCurrency } from '../utils/currency';
import { formatOrderDateTime } from '../utils/order-date';
import { formatOrderShortId, formatOrderStatus } from '../utils/order';
import MenuImage from '../components/UI/MenuImage/MenuImage';

const AdminOrderDetails = () => {
  const { orderId = '' } = useParams();
  const { order, isLoading, error, refresh } =
    useAdminOrderDetailsPage(orderId);
  const location = useLocation();
  const returnTo = location.state?.ordersReturnTo;

  return (
    <AdminLayout
      title="Order details"
      action={<AdminRefreshButton onClick={refresh} />}
    >
      <Link
        className={classes.BackLink}
        to={
          typeof returnTo === 'string' &&
          /^\/admin\/orders(?:\?|$)/.test(returnTo)
            ? returnTo
            : '/admin/orders'
        }
      >
        Back to orders
      </Link>

      {isLoading && <AdminStatusText>Loading order...</AdminStatusText>}

      {error && (
        <div className={classes.Card}>
          <h2 className={classes.CardTitle}>Order unavailable</h2>
          <AdminStatusText tone="error">{error}</AdminStatusText>
        </div>
      )}

      {!isLoading && !error && order && (
        <>
          <header className={classes.Hero}>
            <div>
              <p className={classes.Eyebrow}>
                Order #{formatOrderShortId(order.id)}
              </p>
              <h2 className={classes.Title}>Order summary</h2>
              <p className={classes.Meta}>
                {formatOrderDateTime(order.createdAt)}
              </p>
            </div>
            <div className={classes.Status}>
              {formatOrderStatus(order.status)}
            </div>
          </header>
          <section
            className={`${classes.Card} ${classes.PaymentSummary}`}
            aria-label="Payment and cancellation"
          >
            <h2 className={classes.CardTitle}>Payment</h2>
            <p className={classes.Meta}>
              Payment status:{' '}
              {order.payment?.status.replaceAll('_', ' ') ?? 'Unavailable'}
            </p>
            {order.payment?.paidAt && (
              <p className={classes.Meta}>
                Paid: {formatOrderDateTime(order.payment.paidAt)}
              </p>
            )}
            {order.cancellationReason && (
              <p className={classes.Meta}>
                Cancellation reason:{' '}
                {order.cancellationReason.replaceAll('_', ' ')}
              </p>
            )}
            {order.cancelledAt && (
              <p className={classes.Meta}>
                Cancelled: {formatOrderDateTime(order.cancelledAt)}
              </p>
            )}
            {order.status === 'cancelled' &&
              order.payment?.status === 'paid' && (
                <AdminStatusText tone="error">
                  Paid - arrange refund separately
                </AdminStatusText>
              )}
          </section>

          <section className={classes.Card}>
            <div className={classes.CardHeader}>
              <h2 className={classes.CardTitle}>Items</h2>
              <strong className={classes.Total}>
                {formatCurrency(order.totalCents)}
              </strong>
            </div>

            <div className={classes.ItemList}>
              {order.items.map((item) => (
                <article className={classes.Item} key={item.menuItemId}>
                  <MenuImage
                    className={classes.ItemImage}
                    src={item.image}
                    alt={item.name}
                  />
                  <div className={classes.ItemInfo}>
                    <h3 className={classes.ItemName}>{item.name}</h3>
                    <p className={classes.ItemMeta}>
                      {formatCurrency(item.priceCents)} x {item.quantity}
                    </p>
                  </div>
                  <strong className={classes.Subtotal}>
                    {formatCurrency(item.subtotalCents)}
                  </strong>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOrderDetails;
