import React, { useMemo, useRef } from 'react';
import classes from './CheckoutDialog.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import PaymentBar from './PaymentBar/PaymentBar';
import type { CartMenuItem } from '../../../types/cart';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import { useDialogA11y } from '../../../hooks/useDialogA11y';
import Backdrop from '../../UI/Backdrop/Backdrop';
import CartLineItem from '../CartLineItem/CartLineItem';

interface CheckoutDialogProps {
  onClose: () => void;
  menuItems: CartMenuItem[];
}

const CheckoutDialog = ({ onClose, menuItems }: CheckoutDialogProps) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const estimatedTotalCents = useCartSelector((ctx) => ctx.estimatedTotalCents);
  const quoteNotice = useCartSelector((ctx) => ctx.quoteNotice);

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

  return (
    <Backdrop className={classes.CheckoutBackdrop}>
      <div
        ref={dialogRef}
        className={classes.Checkout}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <div className={classes.OrderSummary}>
          <header className={classes.Header}>
            <h2 id="checkout-title" className={classes.Title}>
              Order Details
            </h2>

            <button
              ref={closeButtonRef}
              type="button"
              className={classes.Close}
              aria-label="Close checkout"
              onClick={handleClose}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </header>

          <div className={classes.ItemList}>
            {visibleMenuItems.map((menuItem) => (
              <CartLineItem key={menuItem.id} menuItem={menuItem} />
            ))}
          </div>

          {quoteNotice && (
            <footer className={classes.Footer}>
              <p className={classes.PriceNotice}>{quoteNotice}</p>
            </footer>
          )}
        </div>

        <PaymentBar
          totalCents={estimatedTotalCents}
          onOrderComplete={onClose}
        />
      </div>
    </Backdrop>
  );
};

export default CheckoutDialog;
