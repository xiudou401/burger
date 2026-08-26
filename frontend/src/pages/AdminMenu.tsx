import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import classes from './AdminMenu.module.css';
import { useAdminMenuPage } from './hooks/useAdminMenuPage';
import type { MenuItem } from '../types/menu-item';
import AdminMenuItemDialog from './AdminMenuItemDialog';
import AdminMenuDeleteDialog from './AdminMenuDeleteDialog';
import AdminMenuListCard from './AdminMenuListCard';

const AdminMenu = () => {
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(
    null,
  );
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

      <AdminMenuListCard
        menuItems={menuItems}
        isLoading={isLoading}
        message={message}
        error={error}
        showError={!isMenuItemDialogOpen}
        onEdit={openEditMenuItemDialog}
        onDelete={setMenuItemToDelete}
      />
    </AdminLayout>
  );
};

export default AdminMenu;
