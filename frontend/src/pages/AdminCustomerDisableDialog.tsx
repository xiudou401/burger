import { FormEvent } from 'react';
import AdminButton from '../components/Admin/AdminButton';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminFormField from '../components/Admin/AdminFormField';
import formControls from '../components/Admin/AdminFormControls.module.css';
import type { AdminCustomer } from '../types/admin-customer';
import classes from './AdminCustomers.module.css';

interface AdminCustomerDisableDialogProps {
  customer: AdminCustomer;
  reason: string;
  isBusy: boolean;
  onReasonChange: (reason: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const AdminCustomerDisableDialog = ({
  customer,
  reason,
  isBusy,
  onReasonChange,
  onSubmit,
  onClose,
}: AdminCustomerDisableDialogProps) => {
  return (
    <AdminDialog
      title="Disable customer"
      description={customer.email ?? customer.name}
      onClose={onClose}
      closeDisabled={isBusy}
    >
      <form className={classes.DisableForm} onSubmit={onSubmit}>
        <AdminFormField label="Reason" htmlFor="disable-customer-reason">
          <textarea
            id="disable-customer-reason"
            className={formControls.Textarea}
            value={reason}
            placeholder="Optional note for the account record"
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </AdminFormField>

        <div className={classes.DialogActions}>
          <AdminButton
            variant="secondary"
            type="button"
            disabled={isBusy}
            onClick={onClose}
            fullWidthOnMobile
          >
            Cancel
          </AdminButton>
          <AdminButton variant="danger" disabled={isBusy} fullWidthOnMobile>
            Disable
          </AdminButton>
        </div>
      </form>
    </AdminDialog>
  );
};

export default AdminCustomerDisableDialog;
