import classes from './CartSummary.module.css';
import { formatCurrency } from '../../../utils/currency';

interface CartSummaryProps {
  totalQuantity: number;
  totalCents?: number;
}

const CartSummary = ({ totalQuantity, totalCents }: CartSummaryProps) => {
  const itemCountText = `${totalQuantity} ${
    totalQuantity === 1 ? 'item' : 'items'
  }`;

  return (
    <>
      {totalQuantity === 0 ? (
        <span className={classes.EmptyCartText}>Cart is empty</span>
      ) : totalCents === undefined ? (
        <span className={classes.Price}>{itemCountText}</span>
      ) : (
        <span className={classes.Price}>
          <span>{itemCountText}</span>
          {formatCurrency(totalCents)}
        </span>
      )}
    </>
  );
};

export default CartSummary;
