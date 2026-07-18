import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import classes from './CheckoutDialog.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import PaymentBar from './PaymentBar/PaymentBar';
import type { CartMenuItem } from '../../../types/cart';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import { formatCurrency } from '../../../utils/currency';
import { useDialogA11y } from '../../../hooks/useDialogA11y';

const CheckoutRoot = document.getElementById('checkout-root');

interface CheckoutDialogProps {
  onClose: () => void;
  menuItems: CartMenuItem[];
}

const CheckoutDialog = ({ onClose, menuItems }: CheckoutDialogProps) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const estimatedTotalCents = useCartSelector((ctx) => ctx.estimatedTotalCents);

  const items = useCartSelector((ctx) => ctx.items);

  const visibleMenuItems = useMemo(() => {
    const qtyMap = new Map(items.map((i) => [i.id, i.quantity]));

    return menuItems.filter((item) => (qtyMap.get(item.id) ?? 0) > 0);
  }, [menuItems, items]);

  const handleClose = () => onClose();
  const { dialogRef, handleDialogKeyDown } = useDialogA11y<HTMLDivElement>({
    isOpen: true,
    onClose: handleClose,
    initialFocusRef: closeButtonRef,
  });

  if (!CheckoutRoot) return null;

  return ReactDOM.createPortal(
    <div
      ref={dialogRef}
      className={classes.Checkout}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      tabIndex={-1}
      onKeyDown={handleDialogKeyDown}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className={classes.Close}
        aria-label="Close checkout"
        onClick={handleClose}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <div className={classes.OrderSummary}>
        <header className={classes.Header}>
          <h2 id="checkout-title" className={classes.Title}>
            Order Details
          </h2>
        </header>

        <div>
          {visibleMenuItems.map((menuItem) => (
            <CheckoutItem key={menuItem.id} menuItem={menuItem} />
          ))}
        </div>

        <footer className={classes.Footer}>
          <p className={classes.TotalPrice}>
            Total {formatCurrency(estimatedTotalCents)}
          </p>
        </footer>
      </div>

      <PaymentBar totalCents={estimatedTotalCents} onOrderComplete={onClose} />
    </div>,
    CheckoutRoot,
  );
};

export default CheckoutDialog;
