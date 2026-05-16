import { Link, useParams } from 'react-router-dom';
import classes from './OrderDetails.module.css';
import AccountBar from '../components/Auth/AccountBar';
import { useOrderDetailsPage } from './hooks/useOrderDetailsPage';

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const OrderDetails = () => {
  const { orderId = '' } = useParams();
  const { order, isLoading, error } = useOrderDetailsPage(orderId);

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
            <header className={classes.Hero}>
              <div>
                <p className={classes.Eyebrow}>Order #{order.id.slice(-6)}</p>
                <h1 className={classes.Title}>Order details</h1>
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
      </section>
    </main>
  );
};

export default OrderDetails;
