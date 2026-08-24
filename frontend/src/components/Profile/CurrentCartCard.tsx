import { Link } from 'react-router-dom';
import classes from './CurrentCartCard.module.css';
import { formatCurrency } from '../../utils/currency';

interface CurrentCartCardProps {
  totalQuantity: number;
  displayTotalCents: number;
  hasCartItems: boolean;
}

const CurrentCartCard = ({
  totalQuantity,
  displayTotalCents,
  hasCartItems,
}: CurrentCartCardProps) => {
  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Current cart</h2>
      </div>

      <div className={classes.CartSummary}>
        <div className={classes.Metric}>
          <span className={classes.MetricValue}>{totalQuantity}</span>
          <span className={classes.MetricLabel}>Items</span>
        </div>
        <div className={classes.Metric}>
          <span className={classes.MetricValue}>
            {formatCurrency(displayTotalCents)}
          </span>
          <span className={classes.MetricLabel}>Cart total</span>
        </div>
      </div>

      {hasCartItems ? (
        <div className={classes.Actions}>
          <Link
            className={classes.PrimaryAction}
            to="/"
            state={{ openCart: true }}
          >
            Review cart
          </Link>
        </div>
      ) : (
        <p className={classes.EmptyState}>
          Your cart is empty. Pick a favorite and it will be ready here.
        </p>
      )}
    </section>
  );
};

export default CurrentCartCard;
