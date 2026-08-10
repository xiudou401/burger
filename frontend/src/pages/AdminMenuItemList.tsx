import AdminButton from '../components/Admin/AdminButton';
import MenuImage from '../components/UI/MenuImage/MenuImage';
import type { MenuItem } from '../types/menu-item';
import { formatCurrency } from '../utils/currency';
import classes from './AdminMenu.module.css';

interface AdminMenuItemListProps {
  menuItems: MenuItem[];
  onEdit: (menuItem: MenuItem) => void;
  onDelete: (menuItem: MenuItem) => void;
}

const AdminMenuItemList = ({
  menuItems,
  onEdit,
  onDelete,
}: AdminMenuItemListProps) => {
  return (
    <div className={classes.MenuItemList}>
      {menuItems.map((menuItem) => (
        <article className={classes.MenuItemRow} key={menuItem.id}>
          <div className={classes.MenuItemInfo}>
            <MenuImage
              className={classes.MenuItemImage}
              src={menuItem.image}
              alt=""
            />
            <div>
              <h3 className={classes.MenuItemName}>{menuItem.name}</h3>
              <div className={classes.Badges}>
                <span className={classes.Badge}>{menuItem.category}</span>
                {!menuItem.isAvailable && (
                  <span className={classes.SoldOutBadge}>Sold out</span>
                )}
              </div>
              <p className={classes.MenuItemDescription}>
                {menuItem.description}
              </p>
            </div>
          </div>

          <strong className={classes.Price}>
            {formatCurrency(menuItem.priceCents)}
          </strong>

          <div className={classes.RowActions}>
            <AdminButton
              variant="secondary"
              size="compact"
              type="button"
              onClick={() => onEdit(menuItem)}
            >
              Edit
            </AdminButton>
            <AdminButton
              variant="danger"
              size="compact"
              type="button"
              onClick={() => onDelete(menuItem)}
            >
              Delete
            </AdminButton>
          </div>
        </article>
      ))}
    </div>
  );
};

export default AdminMenuItemList;
