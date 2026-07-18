import { FormEvent, useMemo, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminCard from '../components/Admin/AdminCard';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminFormField from '../components/Admin/AdminFormField';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusText from '../components/Admin/AdminStatusText';
import formControls from '../components/Admin/AdminFormControls.module.css';
import classes from './AdminMenu.module.css';
import { useAdminMenuPage } from './hooks/useAdminMenuPage';
import { formatCurrency } from '../utils/currency';
import { MENU_CATEGORIES } from '../constants/menu-categories';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import type { MenuItem } from '../types/menu-item';

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
        <AdminDialog
          title={isEditing ? 'Edit menu item' : 'Add menu item'}
          size="wide"
          onClose={closeMenuItemDialog}
          closeDisabled={isSubmitting}
        >
          <form className={classes.Form} onSubmit={submitMenuItemForm}>
            <AdminFormField
              label="Name"
              htmlFor="menu-item-name"
              error={fieldErrors.name}
            >
              <input
                id="menu-item-name"
                className={`${formControls.Input} ${
                  fieldErrors.name ? formControls.Invalid : ''
                }`}
                aria-invalid={fieldErrors.name ? 'true' : undefined}
                value={form.name}
                required
                onChange={(event) => updateForm('name', event.target.value)}
              />
            </AdminFormField>

            <AdminFormField
              label="Price"
              htmlFor="menu-item-price"
              error={fieldErrors.price}
            >
              <span
                className={`${formControls.ControlGroup} ${
                  classes.PriceInputGroup
                } ${fieldErrors.price ? formControls.Invalid : ''}`}
              >
                <span className={classes.PricePrefix}>$</span>
                <input
                  id="menu-item-price"
                  className={classes.PriceInput}
                  aria-invalid={fieldErrors.price ? 'true' : undefined}
                  inputMode="decimal"
                  value={form.price}
                  required
                  onChange={(event) => updateForm('price', event.target.value)}
                />
              </span>
            </AdminFormField>

            <AdminFormField
              label="Category"
              htmlFor="menu-item-category"
              className={classes.CategoryField}
            >
              <select
                id="menu-item-category"
                className={formControls.Select}
                value={form.category}
                onChange={(event) => updateForm('category', event.target.value)}
              >
                {MENU_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </AdminFormField>

            <label className={classes.CheckboxField}>
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  updateForm('isAvailable', event.target.checked)
                }
              />
              Available
            </label>

            <AdminFormField
              label="Image"
              htmlFor="menu-item-image"
              className={classes.ImageField}
              error={fieldErrors.image}
            >
              <input
                id="menu-item-image"
                className={`${formControls.Input} ${
                  fieldErrors.image ? formControls.Invalid : ''
                }`}
                aria-invalid={fieldErrors.image ? 'true' : undefined}
                placeholder="/img/meals/1.png"
                value={form.image}
                onChange={(event) => updateForm('image', event.target.value)}
              />
            </AdminFormField>

            <AdminFormField
              label="Description"
              htmlFor="menu-item-description"
              className={classes.DescriptionField}
            >
              <textarea
                id="menu-item-description"
                className={formControls.Textarea}
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
              />
            </AdminFormField>

            {error && <p className={classes.Error}>{error}</p>}

            <div className={classes.FormActions}>
              <AdminButton disabled={isSubmitting} fullWidthOnMobile>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Save changes'
                    : 'Add item'}
              </AdminButton>
              <AdminButton
                variant="secondary"
                type="button"
                disabled={isSubmitting}
                onClick={closeMenuItemDialog}
                fullWidthOnMobile
              >
                Cancel
              </AdminButton>
            </div>
          </form>
        </AdminDialog>
      )}

      {menuItemToDelete && (
        <AdminDialog
          title="Delete menu item"
          description={menuItemToDelete.name}
          onClose={closeDeleteDialog}
        >
          <p className={classes.ConfirmText}>
            This will remove the item from the menu. This action cannot be
            undone.
          </p>

          <div className={classes.DialogActions}>
            <AdminButton
              variant="secondary"
              type="button"
              onClick={closeDeleteDialog}
              fullWidthOnMobile
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="danger"
              type="button"
              onClick={confirmDeleteMenuItem}
              fullWidthOnMobile
            >
              Delete
            </AdminButton>
          </div>
        </AdminDialog>
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

        <div className={classes.MenuItemList}>
          {filteredMenuItems.map((menuItem) => (
            <article className={classes.MenuItemRow} key={menuItem.id}>
              <div className={classes.MenuItemInfo}>
                {menuItem.image && (
                  <img
                    className={classes.MenuItemImage}
                    src={menuItem.image}
                    alt=""
                  />
                )}
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
                  onClick={() => openEditMenuItemDialog(menuItem)}
                >
                  Edit
                </AdminButton>
                <AdminButton
                  variant="danger"
                  size="compact"
                  type="button"
                  onClick={() => setMenuItemToDelete(menuItem)}
                >
                  Delete
                </AdminButton>
              </div>
            </article>
          ))}
        </div>
      </AdminCard>
    </AdminLayout>
  );
};

export default AdminMenu;
