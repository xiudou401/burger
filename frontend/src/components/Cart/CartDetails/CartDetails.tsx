import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import MenuItemCard from '../../MenuItems/MenuItemCard/MenuItemCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Confirm from '../../UI/Confirm/Confirm';
import { useCartActions } from '../../../store/cart/hooks/useCartActions';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';

interface CartDetailsProps {
  open: boolean;
}

const CartDetails = ({ open }: CartDetailsProps) => {
  const { clearCart, deleteItem } = useCartActions();

  const itemsLength = useCartSelector((ctx) => ctx.items.length);
  const quote = useCartSelector((ctx) => ctx.quote);
  const quoteError = useCartSelector((ctx) => ctx.quoteError);
  const quoteErrorAction = useCartSelector((ctx) => ctx.quoteErrorAction);
  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (itemsLength === 0) return;
    void ensureQuote().catch(() => {
      // ensureQuote updates quoteError for user-visible failures.
    });
  }, [open, itemsLength, ensureQuote]);

  const menuItems = useMemo(() => {
    return quote?.menuItems ?? [];
  }, [quote]);

  const handleClearCart = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const onOk = () => clearCart();
  const onCancel = () => setShowConfirm(false);
  const retryQuote = () => {
    void ensureQuote().catch(() => {
      // ensureQuote updates quoteError for user-visible failures.
    });
  };
  const handleQuoteErrorAction = () => {
    if (quoteErrorAction?.type === 'removeItem') {
      deleteItem(quoteErrorAction.itemId);
      return;
    }

    retryQuote();
  };

  return (
    <Backdrop>
      {showConfirm && (
        <Confirm confirmText="Are you sure?" onCancel={onCancel} onOk={onOk} />
      )}

      <div
        id="cart-details"
        className={classes.CartDetails}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <header className={classes.Header}>
          <h2 className={classes.Title}>Cart details</h2>
          <div className={classes.Clear} onClick={handleClearCart}>
            <FontAwesomeIcon icon={faTrash} />
            <span>Clear cart</span>
          </div>
        </header>

        <div className={classes.MenuItemList}>
          {!quote && !quoteError && itemsLength > 0 && (
            <p className={classes.Status}>Loading...</p>
          )}

          {quoteError && (
            <div className={classes.ErrorStatus} role="alert">
              <p>{quoteError}</p>
              <button type="button" onClick={handleQuoteErrorAction}>
                {quoteErrorAction?.type === 'removeItem'
                  ? 'Remove item'
                  : 'Retry'}
              </button>
            </div>
          )}

          {menuItems.map((menuItem) => (
            <MenuItemCard
              key={menuItem.id}
              menuItem={menuItem}
              noDesc
              variant="compact"
            />
          ))}

          {quote && menuItems.length === 0 && (
            <p style={{ padding: 12, color: '#999' }}>Your cart is empty.</p>
          )}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
