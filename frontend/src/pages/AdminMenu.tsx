import { FormEvent, useMemo, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import classes from './AdminMenu.module.css';
import { useAdminMenuPage } from './hooks/useAdminMenuPage';
import { formatCurrency } from '../utils/currency';
import { MENU_CATEGORIES } from '../constants/menu-categories';
import Backdrop from '../components/UI/Backdrop/Backdrop';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import type { MenuItem } from '../types/menu-item';

const AdminMenu = () => {
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false);
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

  const submitMenuItemForm = async (event: FormEvent<HTMLFormElement>) => {
    const didSave = await submit(event);

    if (didSave) {
      setIsMenuItemDialogOpen(false);
    }
  };

  return (
    <AdminLayout title="Menu">
      {isMenuItemDialogOpen && (
        <Backdrop className={classes.DialogBackdrop}>
          <section
            className={classes.Dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-dialog-title"
          >
            <header className={classes.DialogHeader}>
              <h2 id="menu-item-dialog-title" className={classes.CardTitle}>
                {isEditing ? 'Edit menu item' : 'Add menu item'}
              </h2>
            </header>

            <form className={classes.Form} onSubmit={submitMenuItemForm}>
              <label className={classes.Field}>
                Name
                <input
                  className={`${classes.Input} ${
                    fieldErrors.name ? classes.InputError : ''
                  }`}
                  aria-invalid={fieldErrors.name ? 'true' : undefined}
                  value={form.name}
                  required
                  onChange={(event) => updateForm('name', event.target.value)}
                />
                {fieldErrors.name && (
                  <span className={classes.FieldError}>{fieldErrors.name}</span>
                )}
              </label>

              <label className={classes.Field}>
                Price
                <span
                  className={`${classes.PriceInputGroup} ${
                    fieldErrors.price ? classes.InputError : ''
                  }`}
                >
                  <span className={classes.PricePrefix}>$</span>
                  <input
                    className={classes.PriceInput}
                    aria-invalid={fieldErrors.price ? 'true' : undefined}
                    inputMode="decimal"
                    value={form.price}
                    required
                    onChange={(event) =>
                      updateForm('price', event.target.value)
                    }
                  />
                </span>
                {fieldErrors.price && (
                  <span className={classes.FieldError}>
                    {fieldErrors.price}
                  </span>
                )}
              </label>

              <label className={`${classes.Field} ${classes.CategoryField}`}>
                Category
                <select
                  className={classes.Input}
                  value={form.category}
                  onChange={(event) =>
                    updateForm('category', event.target.value)
                  }
                >
                  {MENU_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`${classes.Field} ${classes.CheckboxField}`}>
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    updateForm('isAvailable', event.target.checked)
                  }
                />
                Available
              </label>

              <label className={`${classes.Field} ${classes.ImageField}`}>
                Image
                <input
                  className={`${classes.Input} ${
                    fieldErrors.image ? classes.InputError : ''
                  }`}
                  aria-invalid={fieldErrors.image ? 'true' : undefined}
                  placeholder="/img/meals/1.png"
                  value={form.image}
                  onChange={(event) => updateForm('image', event.target.value)}
                />
                {fieldErrors.image && (
                  <span className={classes.FieldError}>
                    {fieldErrors.image}
                  </span>
                )}
              </label>

              <label className={`${classes.Field} ${classes.DescriptionField}`}>
                Description
                <textarea
                  className={classes.Textarea}
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                />
              </label>

              {error && <p className={classes.Error}>{error}</p>}

              <div className={classes.FormActions}>
                <button
                  className={classes.PrimaryButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isEditing
                      ? 'Save changes'
                      : 'Add item'}
                </button>
                <button
                  className={classes.SecondaryButton}
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeMenuItemDialog}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </Backdrop>
      )}

      <section className={classes.Card}>
        <div className={classes.CardHeader}>
          <h2 className={classes.CardTitle}>Menu items</h2>
          {message && <p className={classes.Success}>{message}</p>}
          {!isMenuItemDialogOpen && error && (
            <p className={classes.Error}>{error}</p>
          )}
        </div>

        <div className={classes.MenuToolbar}>
          <div className={classes.AdminSearch}>
            <MenuSearch
              onSearch={setSearchQuery}
              placeholder="Search menu items"
              variant="compact"
            />
          </div>
          <div className={classes.AdminActionButtons}>
            <button
              className={classes.PrimaryButton}
              type="button"
              onClick={openAddMenuItemDialog}
            >
              Add item
            </button>
            <button
              className={classes.SecondaryButton}
              type="button"
              onClick={refresh}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading && <p className={classes.StateText}>Loading menu...</p>}
        {!isLoading && menuItems.length === 0 && (
          <p className={classes.StateText}>No menu items yet.</p>
        )}
        {!isLoading &&
          menuItems.length > 0 &&
          filteredMenuItems.length === 0 && (
            <p className={classes.StateText}>
              No menu items match your search.
            </p>
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
                <button
                  className={classes.SecondaryButton}
                  type="button"
                  onClick={() => openEditMenuItemDialog(menuItem)}
                >
                  Edit
                </button>
                <button
                  className={classes.DangerButton}
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to delete this menu item?',
                      )
                    ) {
                      removeMenuItem(menuItem.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminMenu;
