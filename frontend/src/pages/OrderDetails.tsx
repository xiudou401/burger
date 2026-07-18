import { Link, useLocation, useParams } from 'react-router-dom';
import classes from './OrderDetails.module.css';
import AccountBar from '../components/Auth/AccountBar';
import { useOrderDetailsPage } from './hooks/useOrderDetailsPage';
import { formatCurrency } from '../utils/currency';
import { formatMediumDateTime } from '../utils/date';
import { formatOrderShortId, formatOrderStatus } from '../utils/order';

const OrderDetails = () => {
  const { orderId = '' } = useParams();
  const location = useLocation();
  const { order, isLoading, error } = useOrderDetailsPage(orderId);
  const paymentConfirmed =
    (location.state as { paymentConfirmed?: boolean } | null)
      ?.paymentConfirmed === true;

  return (
    <main className={classes.Page}>
      <AccountBar />

      <section className={classes.Shell}>
        <Link className={classes.BackLink} to="/profile">
          Back to profile
        </Link>

        {isLoading && <p className={classes.StateText}>Loading order...</p>}

        {error && (
          <div className={classes.Card}>
            <h1 className={classes.Title}>Order unavailable</h1>
            <p className={classes.StateText}>{error}</p>
          </div>
        )}

        {!isLoading && !error && order && (
          <>
            {paymentConfirmed && (
              <section className={classes.Confirmation} role="status">
                <p className={classes.ConfirmationEyebrow}>Order confirmed</p>
                <h1 className={classes.ConfirmationTitle}>Payment received</h1>
                <p className={classes.ConfirmationText}>
                  We have received your payment and your order is being
                  confirmed by the kitchen.
                </p>
              </section>
            )}

            <header className={classes.Hero}>
              <div>
                <p className={classes.Eyebrow}>
                  Order #{formatOrderShortId(order.id)}
                </p>
                <h1 className={classes.Title}>Order details</h1>
                <p className={classes.Meta}>
                  {formatMediumDateTime(order.createdAt)}
                </p>
              </div>
              <div className={classes.Status}>
                {formatOrderStatus(order.status)}
              </div>
            </header>

            <section className={classes.Card}>
              <div className={classes.CardHeader}>
                <h2 className={classes.CardTitle}>Items</h2>
                <strong className={classes.Total}>
                  {formatCurrency(order.totalCents)}
                </strong>
              </div>

              <div className={classes.ItemList}>
                {order.items.map((item) => (
                  <article className={classes.Item} key={item.mealId}>
                    {item.image && (
                      <img
                        className={classes.ItemImage}
                        src={item.image}
                        alt={item.name}
                      />
                    )}
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
      </section>
    </main>
  );
};

export default OrderDetails;
