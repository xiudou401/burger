import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import classes from './OrderDetails.module.css';
import AccountBar from '../components/Auth/AccountBar';
import {
  isConfirmedStripeOrder,
  useOrderDetailsPage,
} from './hooks/useOrderDetailsPage';
import { formatCurrency } from '../utils/currency';
import { formatMediumDateTime } from '../utils/date';
import { formatOrderShortId, formatOrderStatus } from '../utils/order';
import MenuImage from '../components/UI/MenuImage/MenuImage';
import { useCartActions } from '../store/cart/hooks/useCartActions';
import { clearPersistedCart } from '../store/cart/cart-reducer';

const OrderDetails = () => {
  const { orderId = '' } = useParams();
  const location = useLocation();
  const returnedFromSuccessfulPayment =
    (
      location.state as {
        returnedFromSuccessfulPayment?: boolean;
      } | null
    )?.returnedFromSuccessfulPayment === true;
  const { order, isLoading, error } = useOrderDetailsPage(orderId, {
    confirmPayment: returnedFromSuccessfulPayment,
  });
  const { clearCart } = useCartActions();
  const hasClearedConfirmedCartRef = useRef(false);
  const hasConfirmedPayment = Boolean(
    order && returnedFromSuccessfulPayment && isConfirmedStripeOrder(order),
  );

  useEffect(() => {
    if (!hasConfirmedPayment || hasClearedConfirmedCartRef.current) {
      return;
    }

    hasClearedConfirmedCartRef.current = true;
    clearPersistedCart();
    clearCart();
  }, [clearCart, hasConfirmedPayment]);

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
            {returnedFromSuccessfulPayment &&
              (hasConfirmedPayment ? (
                <section className={classes.Confirmation} role="status">
                  <p className={classes.ConfirmationEyebrow}>Order confirmed</p>
                  <h1 className={classes.ConfirmationTitle}>
                    Payment received
                  </h1>
                  <p className={classes.ConfirmationText}>
                    We have received your payment and your order is being
                    confirmed by the kitchen.
                  </p>
                </section>
              ) : (
                <section
                  className={`${classes.Confirmation} ${classes.PendingConfirmation}`}
                  role="status"
                >
                  <p className={classes.ConfirmationEyebrow}>
                    Confirming payment
                  </p>
                  <h1 className={classes.ConfirmationTitle}>
                    Checking your order
                  </h1>
                  <p className={classes.ConfirmationText}>
                    We are confirming your payment with the server.
                  </p>
                </section>
              ))}

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
      </section>
    </main>
  );
};

export default OrderDetails;
