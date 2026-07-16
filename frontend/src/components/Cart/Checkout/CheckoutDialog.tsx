import React, { KeyboardEvent, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import classes from './CheckoutDialog.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CheckoutItem from './CheckoutItem/CheckoutItem';
import PaymentBar from './PaymentBar/PaymentBar';
import type { CartMenuItem } from '../../../types/cart';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import { formatCurrency } from '../../../utils/currency';

const CheckoutRoot = document.getElementById('checkout-root');

interface CheckoutDialogProps {
  onClose: () => void;
  menuItems: CartMenuItem[];
}

const CheckoutDialog = ({ onClose, menuItems }: CheckoutDialogProps) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const estimatedTotalCents = useCartSelector((ctx) => ctx.estimatedTotalCents);

  const items = useCartSelector((ctx) => ctx.items);

  const visibleMenuItems = useMemo(() => {
    const qtyMap = new Map(items.map((i) => [i.id, i.quantity]));

    return menuItems.filter((item) => (qtyMap.get(item.id) ?? 0) > 0);
  }, [menuItems, items]);

  const handleClose = () => onClose();

  const getFocusableElements = () => {
    if (!dialogRef.current) return [];

    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(','),
      ),
    ).filter((element) => !element.hasAttribute('aria-hidden'));
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, []);

  if (!CheckoutRoot) return null;

  return ReactDOM.createPortal(
    <div
      ref={dialogRef}
      className={classes.Checkout}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
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
