import { Link } from 'react-router-dom';
import classes from './RecentOrdersCard.module.css';

const RecentOrdersCard = () => {
  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Recent orders</h2>
      </div>

      <div className={classes.OrderTile}>
        <div className={classes.OrderIcon}>0</div>
        <p className={classes.OrderText}>
          Your completed orders will appear here after checkout is wired to order
          history.
        </p>
        <div className={classes.Actions}>
          <Link className={classes.SecondaryAction} to="/">
            Start an order
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecentOrdersCard;
