import AdminButton from '../components/Admin/AdminButton';
import AdminDialog from '../components/Admin/AdminDialog';
import type { MenuItem } from '../types/menu-item';
import classes from './AdminMenu.module.css';

interface AdminMenuDeleteDialogProps {
  menuItem: MenuItem;
  onCancel: () => void;
  onConfirm: () => void;
}

const AdminMenuDeleteDialog = ({
  menuItem,
  onCancel,
  onConfirm,
}: AdminMenuDeleteDialogProps) => {
  return (
    <AdminDialog
      title="Delete menu item"
      description={menuItem.name}
      onClose={onCancel}
    >
      <p className={classes.ConfirmText}>
        This will remove the item from the menu. This action cannot be undone.
      </p>

      <div className={classes.DialogActions}>
        <AdminButton
          variant="secondary"
          type="button"
          onClick={onCancel}
          fullWidthOnMobile
        >
          Cancel
        </AdminButton>
        <AdminButton
          variant="danger"
          type="button"
          onClick={onConfirm}
          fullWidthOnMobile
        >
          Delete
        </AdminButton>
      </div>
    </AdminDialog>
  );
};

export default AdminMenuDeleteDialog;
