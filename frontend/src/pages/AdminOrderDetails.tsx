import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './OrderDetails.module.css';
import { useAdminOrderDetailsPage } from './hooks/useAdminOrderDetailsPage';
import { formatCurrency } from '../utils/currency';
import { formatMediumDateTime } from '../utils/date';
import { formatOrderShortId, formatOrderStatus } from '../utils/order';

const AdminOrderDetails = () => {
  const { orderId = '' } = useParams();
  const { order, isLoading, error } = useAdminOrderDetailsPage(orderId);

  return (
    <AdminLayout title="Order details">
      <Link className={classes.BackLink} to="/admin/orders">
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
              <h2 className={classes.Title}>Kitchen ticket</h2>
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
    </AdminLayout>
  );
};

export default AdminOrderDetails;
