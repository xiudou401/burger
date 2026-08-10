import { FormEvent } from 'react';
import AdminButton from '../components/Admin/AdminButton';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminFormField from '../components/Admin/AdminFormField';
import formControls from '../components/Admin/AdminFormControls.module.css';
import { MENU_CATEGORIES } from '../constants/menu-categories';
import type {
  AdminMenuForm,
  AdminMenuFormErrors,
} from './utils/admin-menu-form';
import classes from './AdminMenu.module.css';

interface AdminMenuItemDialogProps {
  form: AdminMenuForm;
  fieldErrors: AdminMenuFormErrors;
  isEditing: boolean;
  isSubmitting: boolean;
  error: string | null;
  updateForm: (field: keyof AdminMenuForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
}

const AdminMenuItemDialog = ({
  form,
  fieldErrors,
  isEditing,
  isSubmitting,
  error,
  updateForm,
  onSubmit,
  onClose,
}: AdminMenuItemDialogProps) => {
  return (
    <AdminDialog
      title={isEditing ? 'Edit menu item' : 'Add menu item'}
      size="wide"
      onClose={onClose}
      closeDisabled={isSubmitting}
    >
      <form className={classes.Form} onSubmit={onSubmit}>
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
          hint="Use an existing app image path or a hosted image URL."
        >
          <input
            id="menu-item-image"
            className={`${formControls.Input} ${
              fieldErrors.image ? formControls.Invalid : ''
            }`}
            aria-invalid={fieldErrors.image ? 'true' : undefined}
            placeholder="/img/meals/1.png or https://..."
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
            onChange={(event) => updateForm('description', event.target.value)}
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
            onClick={onClose}
            fullWidthOnMobile
          >
            Cancel
          </AdminButton>
        </div>
      </form>
    </AdminDialog>
  );
};

export default AdminMenuItemDialog;
