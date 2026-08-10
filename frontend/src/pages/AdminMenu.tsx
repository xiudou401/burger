import { FormEvent, useMemo, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminCard from '../components/Admin/AdminCard';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './AdminMenu.module.css';
import { useAdminMenuPage } from './hooks/useAdminMenuPage';
import { formatCurrency } from '../utils/currency';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import type { MenuItem } from '../types/menu-item';
import AdminMenuItemDialog from './AdminMenuItemDialog';
import AdminMenuDeleteDialog from './AdminMenuDeleteDialog';
import AdminMenuItemList from './AdminMenuItemList';

const AdminMenu = () => {
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const {
    menuItems,
    form,
    isEditing,
    isLoading,
    isSubmitting,
    error,
    message,
    fieldErrors,
    updateForm,
    submit,
    editMenuItem,
    removeMenuItem,
    resetForm,
    refresh,
  } = useAdminMenuPage();

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

  const openAddMenuItemDialog = () => {
    resetForm();
    setIsMenuItemDialogOpen(true);
  };

  const openEditMenuItemDialog = (menuItem: MenuItem) => {
    editMenuItem(menuItem);
    setIsMenuItemDialogOpen(true);
  };

  const closeMenuItemDialog = () => {
    if (isSubmitting) return;

    resetForm();
    setIsMenuItemDialogOpen(false);
  };

  const closeDeleteDialog = () => {
    setMenuItemToDelete(null);
  };

  const confirmDeleteMenuItem = () => {
    if (!menuItemToDelete) return;

    removeMenuItem(menuItemToDelete.id);
    setMenuItemToDelete(null);
  };

  const submitMenuItemForm = async (event: FormEvent<HTMLFormElement>) => {
    const didSave = await submit(event);

    if (didSave) {
      setIsMenuItemDialogOpen(false);
    }
  };

  return (
    <AdminLayout
      title="Menu"
      action={
        <div className={classes.HeaderActions}>
          <AdminButton
            size="compact"
            type="button"
            onClick={openAddMenuItemDialog}
          >
            Add item
          </AdminButton>
          <AdminRefreshButton onClick={refresh} />
        </div>
      }
    >
      {isMenuItemDialogOpen && (
        <AdminMenuItemDialog
          form={form}
          fieldErrors={fieldErrors}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          error={error}
          updateForm={updateForm}
          onSubmit={submitMenuItemForm}
          onClose={closeMenuItemDialog}
        />
      )}

      {menuItemToDelete && (
        <AdminMenuDeleteDialog
          menuItem={menuItemToDelete}
          onCancel={closeDeleteDialog}
          onConfirm={confirmDeleteMenuItem}
        />
      )}

      <AdminCard>
        {(message || (!isMenuItemDialogOpen && error)) && (
          <div className={classes.CardHeader}>
            {message && (
              <AdminStatusText tone="success">{message}</AdminStatusText>
            )}
            {!isMenuItemDialogOpen && error && (
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
        {!isLoading &&
          menuItems.length > 0 &&
          filteredMenuItems.length === 0 && (
            <AdminStatusText>No menu items match your search.</AdminStatusText>
          )}

        <AdminMenuItemList
          menuItems={filteredMenuItems}
          onEdit={openEditMenuItemDialog}
          onDelete={setMenuItemToDelete}
        />
      </AdminCard>
    </AdminLayout>
  );
};

export default AdminMenu;
