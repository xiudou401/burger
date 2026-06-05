import AdminLayout from '../components/Admin/AdminLayout';
import classes from './AdminMenu.module.css';
import { useAdminMenuPage } from './hooks/useAdminMenuPage';
import { formatCurrency } from '../utils/currency';

const AdminMenu = () => {
  const {
    meals,
    form,
    isEditing,
    isLoading,
    isSubmitting,
    error,
    message,
    updateForm,
    submit,
    editMeal,
    removeMeal,
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
          {isEditing ? 'Edit meal' : 'Add meal'}
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
                  : 'Add meal'}
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
        <h2 className={classes.CardTitle}>Meals</h2>

        {isLoading && <p className={classes.StateText}>Loading menu...</p>}
        {!isLoading && meals.length === 0 && (
          <p className={classes.StateText}>No meals yet.</p>
        )}

        <div className={classes.MealList}>
          {meals.map((meal) => (
            <article className={classes.MealRow} key={meal.id}>
              <div className={classes.MealInfo}>
                {meal.image && (
                  <img className={classes.MealImage} src={meal.image} alt="" />
                )}
                <div>
                  <h3 className={classes.MealName}>{meal.name}</h3>
                  <p className={classes.MealDescription}>{meal.description}</p>
                </div>
              </div>

              <strong className={classes.Price}>
                {formatCurrency(meal.priceCents)}
              </strong>

              <div className={classes.RowActions}>
                <button
                  className={classes.SecondaryButton}
                  type="button"
                  onClick={() => editMeal(meal)}
                >
                  Edit
                </button>
                <button
                  className={classes.DangerButton}
                  type="button"
                  onClick={() => removeMeal(meal.id)}
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
