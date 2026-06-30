import AdminLayout from '../components/Admin/AdminLayout';
import classes from './AdminMenu.module.css';
import { useAdminMenuPage } from './hooks/useAdminMenuPage';
import { formatCurrency } from '../utils/currency';
import { MENU_CATEGORIES } from '../constants/menu-categories';

const AdminMenu = () => {
  const {
    menuItems,
    form,
    isEditing,
    isLoading,
    isSubmitting,
    error,
    message,
    updateForm,
    submit,
    editMenuItem,
    removeMenuItem,
    resetForm,
    refresh,
  } = useAdminMenuPage();

  return (
    <AdminLayout
      title="Menu"
      action={
        <button
          className={classes.SecondaryButton}
          type="button"
          onClick={refresh}
        >
          Refresh
        </button>
      }
    >
      <section className={classes.Card}>
        <h2 className={classes.CardTitle}>
          {isEditing ? 'Edit menu item' : 'Add menu item'}
        </h2>

        <form className={classes.Form} onSubmit={submit}>
          <label className={classes.Field}>
            Name
            <input
              className={classes.Input}
              value={form.name}
              required
              onChange={(event) => updateForm('name', event.target.value)}
            />
          </label>

          <label className={classes.Field}>
            Price
            <input
              className={classes.Input}
              min="0"
              step="0.01"
              type="number"
              value={form.priceCents / 100}
              required
              onChange={(event) => updateForm('priceCents', event.target.value)}
            />
          </label>

          <label className={classes.Field}>
            Category
            <select
              className={classes.Input}
              value={form.category}
              onChange={(event) => updateForm('category', event.target.value)}
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

          <label className={`${classes.Field} ${classes.CheckboxField}`}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                updateForm('isFeatured', event.target.checked)
              }
            />
            Featured
          </label>

          <label className={classes.Field}>
            Image
            <input
              className={classes.Input}
              placeholder="/img/meals/1.png"
              value={form.image}
              onChange={(event) => updateForm('image', event.target.value)}
            />
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

          <div className={classes.FormActions}>
            <button className={classes.PrimaryButton} disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save changes'
                  : 'Add item'}
            </button>
            {isEditing && (
              <button
                className={classes.SecondaryButton}
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p className={classes.Success}>{message}</p>}
        {error && <p className={classes.Error}>{error}</p>}
      </section>

      <section className={classes.Card}>
        <h2 className={classes.CardTitle}>Menu items</h2>

        {isLoading && <p className={classes.StateText}>Loading menu...</p>}
        {!isLoading && menuItems.length === 0 && (
          <p className={classes.StateText}>No menu items yet.</p>
        )}

        <div className={classes.MenuItemList}>
          {menuItems.map((menuItem) => (
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
                    {menuItem.isFeatured && (
                      <span className={classes.FeaturedBadge}>Featured</span>
                    )}
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
                  onClick={() => editMenuItem(menuItem)}
                >
                  Edit
                </button>
                <button
                  className={classes.DangerButton}
                  type="button"
                  onClick={() => removeMenuItem(menuItem.id)}
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
