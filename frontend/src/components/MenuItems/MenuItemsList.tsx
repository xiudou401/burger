import React, { forwardRef } from 'react';
import classes from './MenuItemsList.module.css';
import MenuItemCard from './MenuItemCard/MenuItemCard';
import type { MenuItem } from '../../types/menu-item';

interface MenuItemsListProps {
  menuItems: MenuItem[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const MenuItemsList = forwardRef<HTMLDivElement, MenuItemsListProps>(
  ({ menuItems, sentinelRef }, ref) => {
    return (
      <div className={classes.MenuItemsList} ref={ref}>
        {menuItems.map((menuItem) => (
          <MenuItemCard key={menuItem.id} menuItem={menuItem} />
        ))}

        <div className={classes.Sentinel} ref={sentinelRef} />
      </div>
    );
  },
);

MenuItemsList.displayName = 'MenuItemsList';

export default MenuItemsList;
