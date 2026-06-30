import React from 'react';
import type { CartMenuItem } from '../../../../types/cart';
import classes from './CheckoutItem.module.css';
import QuantityCounter from '../../../UI/Counter/QuantityCounter';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { getCartItemQuantity } from '../../../../store/cart/context-accessors';
import { formatCurrency } from '../../../../utils/currency';

interface CheckoutItemProps {
  menuItem: CartMenuItem;
}

const CheckoutItem = ({ menuItem }: CheckoutItemProps) => {
  const quantity = useCartSelector((ctx) =>
    getCartItemQuantity(ctx, menuItem.id),
  );

  if (quantity === 0) return null;

  return (
    <div className={classes.CheckoutItem}>
      <div className={classes.ItemImage}>
        <img src={menuItem.image} alt={menuItem.name} />
      </div>

      <div className={classes.Desc}>
        <h2 className={classes.Title}>{menuItem.name}</h2>

        <div className={classes.PriceOuter}>
          <QuantityCounter id={menuItem.id} />

          <div className={classes.Price}>
            {formatCurrency(menuItem.priceCents * quantity)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CheckoutItem);
