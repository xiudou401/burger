import { useState } from 'react';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminButton from '../components/Admin/AdminButton';
import type { CancellationReason, Order } from '../types/order';
import { formatOrderShortId } from '../utils/order';
import classes from './AdminOrders.module.css';

interface Props {
  order: Order;
  onClose: () => void;
  onConfirm: (reason: CancellationReason) => void;
}

const AdminCancelOrderDialog = ({ order, onClose, onConfirm }: Props) => {
  const [reason, setReason] = useState<CancellationReason>('staff_cancelled');
  return (
    <AdminDialog
      title="Cancel order"
      description={`Order #${formatOrderShortId(order.id)}`}
      onClose={onClose}
    >
      <p className={classes.CancelText}>
        Cancelling stops fulfillment. It does not issue a refund or close an
        open Stripe payment page.
      </p>
      {order.payment?.status === 'paid' && (
        <p role="note" className={classes.CancelText}>
          This order is paid. Arrange any refund separately in Stripe.
        </p>
      )}
      <label className={classes.CancelReason}>
        Cancellation reason
        <select
          value={reason}
          onChange={(event) =>
            setReason(event.target.value as CancellationReason)
          }
        >
          <option value="staff_cancelled">Staff cancellation</option>
          <option value="item_unavailable">Item unavailable</option>
          <option value="duplicate_order">Duplicate order</option>
          <option value="other">Other</option>
        </select>
      </label>
      <div className={classes.Actions}>
        <AdminButton variant="secondary" onClick={onClose}>
          Keep order
        </AdminButton>
        <AdminButton variant="danger" onClick={() => onConfirm(reason)}>
          Confirm cancellation
        </AdminButton>
      </div>
    </AdminDialog>
  );
};

export default AdminCancelOrderDialog;
