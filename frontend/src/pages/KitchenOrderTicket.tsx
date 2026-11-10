import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import AdminButton from '../components/Admin/AdminButton';
import type { Order, OrderStatus } from '../types/order';
import { formatOrderShortId, getOrderActionLabel } from '../utils/order';
import classes from './AdminOrders.module.css';

const WAIT_WARNING_MINUTES = 15;

interface Props {
  order: Order;
  nextStatuses: OrderStatus[];
  isUpdating: boolean;
  isOnline: boolean;
  now: number;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
}

const KitchenOrderTicket = ({
  order,
  nextStatuses,
  isUpdating,
  isOnline,
  now,
  onAdvance,
  onCancel,
}: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const primaryStatus = nextStatuses.find((status) => status !== 'cancelled');
  const elapsed = Math.max(
    0,
    Math.floor((now - new Date(order.createdAt).getTime()) / 60_000),
  );
  const hasAge = Number.isFinite(elapsed);
  const longWait = hasAge && elapsed >= WAIT_WARNING_MINUTES;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [menuOpen]);

  return (
    <article
      className={classes.KitchenTicket}
      aria-label={`Order ${formatOrderShortId(order.id)}`}
    >
      <div className={classes.TicketHeading}>
        <Link className={classes.TicketId} to={`/admin/orders/${order.id}`}>
          #{formatOrderShortId(order.id)}
        </Link>
        {nextStatuses.includes('cancelled') && (
          <div
            ref={menuRef}
            className={classes.TicketMenu}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
              }
            }}
          >
            <button
              ref={menuButtonRef}
              type="button"
              className={classes.MoreButton}
              title="Order options"
              aria-label={`Options for order ${formatOrderShortId(order.id)}`}
              aria-expanded={menuOpen}
              disabled={isUpdating || !isOnline}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </button>
            {menuOpen && (
              <div className={classes.TicketMenuPanel}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCancel();
                  }}
                >
                  Cancel order
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <p
        className={`${classes.TicketAge} ${longWait ? classes.LongWait : ''}`}
        title="Time since the order was placed"
      >
        {hasAge ? `${elapsed} min since ordered` : 'Order time unavailable'}
        {longWait && <strong>Long wait</strong>}
      </p>
      <ul className={classes.TicketItems}>
        {order.items.map((item) => (
          <li key={item.menuItemId}>
            <strong>{item.quantity}x</strong>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
      {primaryStatus && (
        <AdminButton
          className={classes.TicketAction}
          type="button"
          disabled={isUpdating || !isOnline}
          aria-busy={isUpdating}
          onClick={() => onAdvance(primaryStatus)}
        >
          {isUpdating
            ? 'Updating...'
            : primaryStatus === 'completed'
              ? 'Mark collected'
              : getOrderActionLabel(order.status, primaryStatus)}
        </AdminButton>
      )}
    </article>
  );
};

export default KitchenOrderTicket;
