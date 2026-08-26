import { useMemo, useState } from 'react';
import AdminCard from '../components/Admin/AdminCard';
import AdminStatusText from '../components/Admin/AdminStatusText';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import type { MenuItem } from '../types/menu-item';
import { formatCurrency } from '../utils/currency';
import classes from './AdminMenu.module.css';
import AdminMenuItemList from './AdminMenuItemList';

interface AdminMenuListCardProps {
  menuItems: MenuItem[];
  isLoading: boolean;
  message: string | null;
  error: string | null;
  showError: boolean;
  onEdit: (menuItem: MenuItem) => void;
  onDelete: (menuItem: MenuItem) => void;
}

const AdminMenuListCard = ({
  menuItems,
  isLoading,
  message,
  error,
  showError,
  onEdit,
  onDelete,
}: AdminMenuListCardProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenuItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return menuItems;

    return menuItems.filter((menuItem) => {
      return [
        menuItem.name,
        menuItem.description,
        menuItem.category,
        formatCurrency(menuItem.priceCents),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [menuItems, searchQuery]);

  return (
    <AdminCard>
      {(message || (showError && error)) && (
        <div className={classes.CardHeader}>
          {message && (
            <AdminStatusText tone="success">{message}</AdminStatusText>
          )}
          {showError && error && (
            <AdminStatusText tone="error">{error}</AdminStatusText>
          )}
        </div>
      )}

      <div className={classes.MenuToolbar}>
        <div className={classes.AdminSearch}>
          <MenuSearch
            onSearch={setSearchQuery}
            placeholder="Search menu items"
            variant="compact"
          />
        </div>
      </div>

      {isLoading && <AdminStatusText>Loading menu...</AdminStatusText>}
      {!isLoading && menuItems.length === 0 && (
        <AdminStatusText>No menu items yet.</AdminStatusText>
      )}
      {!isLoading && menuItems.length > 0 && filteredMenuItems.length === 0 && (
        <AdminStatusText>No menu items match your search.</AdminStatusText>
      )}

      <AdminMenuItemList
        menuItems={filteredMenuItems}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </AdminCard>
  );
};

export default AdminMenuListCard;
