import React from 'react';
import classes from './MenuItemCard.module.css';
import QuantityCounter from '../../UI/Counter/QuantityCounter';
import type { MenuItem } from '../../../types/menu-item';
import { formatCurrency } from '../../../utils/currency';

interface MenuItemCardProps {
  menuItem: MenuItem;
  noDesc?: boolean;
}

const MenuItemCard = ({ menuItem, noDesc }: MenuItemCardProps) => {
  const categoryLabel =
    menuItem.category[0].toUpperCase() + menuItem.category.slice(1);

  return (
    <div
      className={`${classes.MenuItemCard} ${
        menuItem.isAvailable ? '' : classes.SoldOut
      }`}
    >
      <div className={classes.ImageWrapper}>
        <img src={menuItem.image} alt={menuItem.name} />
      </div>

      <div className={classes.DescBox}>
        <div className={classes.Badges}>
          <span className={classes.CategoryBadge}>{categoryLabel}</span>
          {!menuItem.isAvailable && (
            <span className={classes.SoldOutBadge}>Sold out</span>
          )}
        </div>

        <h2 className={classes.Name}>{menuItem.name}</h2>

        {!noDesc && (
          <p className={classes.Description}>{menuItem.description}</p>
        )}

        <div className={classes.PriceWrapper}>
          <span className={classes.Price}>
            {formatCurrency(menuItem.priceCents)}
          </span>

          <QuantityCounter id={menuItem.id} disabled={!menuItem.isAvailable} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(MenuItemCard);
