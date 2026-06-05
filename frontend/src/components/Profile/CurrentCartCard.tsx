import { Link } from 'react-router-dom';
import classes from './CurrentCartCard.module.css';
import { formatCurrency } from '../../utils/currency';

interface CurrentCartCardProps {
  totalQuantity: number;
  estimatedTotalCents: number;
  hasCartItems: boolean;
}

const CurrentCartCard = ({
  totalQuantity,
  estimatedTotalCents,
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
            {formatCurrency(estimatedTotalCents)}
          </span>
          <span className={classes.MetricLabel}>Estimated total</span>
        </div>
      </div>

      {hasCartItems ? (
        <div className={classes.Actions}>
          <Link className={classes.PrimaryAction} to="/">
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
