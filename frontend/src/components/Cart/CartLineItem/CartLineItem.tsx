import React from 'react';
import classes from './CartLineItem.module.css';
import QuantityCounter from '../../UI/Counter/QuantityCounter';
import { getCartItemQuantity } from '../../../store/cart/context-accessors';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import type { CartMenuItem } from '../../../types/cart';
import { formatCurrency } from '../../../utils/currency';

interface CartLineItemProps {
  menuItem: CartMenuItem;
}

const CartLineItem = ({ menuItem }: CartLineItemProps) => {
  const quantity = useCartSelector((ctx) =>
    getCartItemQuantity(ctx, menuItem.id),
  );

  if (quantity === 0) return null;

  return (
    <div className={classes.CartLineItem}>
      <div className={classes.Image}>
        <img src={menuItem.image} alt={menuItem.name} />
      </div>

      <div className={classes.Content}>
        <h2 className={classes.Name}>{menuItem.name}</h2>

        <div className={classes.Footer}>
          <QuantityCounter id={menuItem.id} />

          <strong className={classes.Price}>
            {formatCurrency(menuItem.priceCents * quantity)}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CartLineItem);
