import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import classes from './OrderDetails.module.css';
import { useAdminOrderDetailsPage } from './hooks/useAdminOrderDetailsPage';

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const AdminOrderDetails = () => {
  const { orderId = '' } = useParams();
  const { order, isLoading, error } = useAdminOrderDetailsPage(orderId);

  return (
    <AdminLayout title="Order details">
      <Link className={classes.BackLink} to="/admin/orders">
        Back to orders
      </Link>

      {isLoading && <p className={classes.StateText}>Loading order...</p>}

      {error && (
        <div className={classes.Card}>
          <h2 className={classes.CardTitle}>Order unavailable</h2>
          <p className={classes.StateText}>{error}</p>
        </div>
      )}

      {!isLoading && !error && order && (
        <>
          <header className={classes.Hero}>
            <div>
              <p className={classes.Eyebrow}>Order #{order.id.slice(-6)}</p>
              <h2 className={classes.Title}>Kitchen ticket</h2>
              <p className={classes.Meta}>{formatDate(order.createdAt)}</p>
            </div>
            <div className={classes.Status}>{order.status}</div>
          </header>

          <section className={classes.Card}>
            <div className={classes.CardHeader}>
              <h2 className={classes.CardTitle}>Items</h2>
              <strong className={classes.Total}>￥{order.total.toFixed(2)}</strong>
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
                      ￥{item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <strong className={classes.Subtotal}>
                    ￥{item.subtotal.toFixed(2)}
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
