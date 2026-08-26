import { FormEvent } from 'react';
import AdminButton from '../components/Admin/AdminButton';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminFormField from '../components/Admin/AdminFormField';
import AdminStatusText from '../components/Admin/AdminStatusText';
import formControls from '../components/Admin/AdminFormControls.module.css';
import classes from './AdminStaff.module.css';

interface AdminStaffInviteDialogProps {
  email: string;
  role: string;
  isSubmitting: boolean;
  error: string | null;
  onEmailChange: (email: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const AdminStaffInviteDialog = ({
  email,
  role,
  isSubmitting,
  error,
  onEmailChange,
  onSubmit,
  onClose,
}: AdminStaffInviteDialogProps) => {
  return (
    <AdminDialog
      title="Invite staff"
      onClose={onClose}
      closeDisabled={isSubmitting}
    >
      <form className={classes.Form} onSubmit={onSubmit}>
        <AdminFormField label="Email" htmlFor="staff-invite-email">
          <input
            id="staff-invite-email"
            className={formControls.Input}
            type="email"
            value={email}
            required
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Role" htmlFor="staff-invite-role">
          <input
            id="staff-invite-role"
            className={formControls.Input}
            type="text"
            value={role}
            readOnly
          />
        </AdminFormField>

        {error && <AdminStatusText tone="error">{error}</AdminStatusText>}

        <div className={classes.FormActions}>
          <AdminButton disabled={isSubmitting} fullWidthOnMobile>
            {isSubmitting ? 'Sending...' : 'Send invite'}
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

export default AdminStaffInviteDialog;
