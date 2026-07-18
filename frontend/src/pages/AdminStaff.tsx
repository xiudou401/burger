import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminCard from '../components/Admin/AdminCard';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminFormField from '../components/Admin/AdminFormField';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusText from '../components/Admin/AdminStatusText';
import formControls from '../components/Admin/AdminFormControls.module.css';
import classes from './AdminStaff.module.css';
import { useAdminStaffPage } from './hooks/useAdminStaffPage';
import { formatShortDateTime } from '../utils/date';

const AdminStaff = () => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const {
    invites,
    email,
    setEmail,
    role,
    isLoading,
    isSubmitting,
    error,
    message,
    devInviteUrl,
    submit,
    revoke,
    refresh,
  } = useAdminStaffPage();

  const closeInviteDialog = () => {
    if (isSubmitting) return;

    setIsInviteDialogOpen(false);
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    const didSend = await submit(event);

    if (didSend) {
      setIsInviteDialogOpen(false);
    }
  };

  return (
    <AdminLayout
      title="Staff"
      action={
        <div className={classes.HeaderActions}>
          <AdminButton
            size="compact"
            type="button"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            Invite staff
          </AdminButton>
          <AdminRefreshButton onClick={refresh} />
        </div>
      }
    >
      {isInviteDialogOpen && (
        <AdminDialog
          title="Invite staff"
          onClose={closeInviteDialog}
          closeDisabled={isSubmitting}
        >
          <form className={classes.Form} onSubmit={submitInvite}>
            <AdminFormField label="Email" htmlFor="staff-invite-email">
              <input
                id="staff-invite-email"
                className={formControls.Input}
                type="email"
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
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
                onClick={closeInviteDialog}
                fullWidthOnMobile
              >
                Cancel
              </AdminButton>
            </div>
          </form>
        </AdminDialog>
      )}

      {message && <AdminStatusText tone="success">{message}</AdminStatusText>}
      {devInviteUrl && (
        <p className={classes.DevLink}>Dev invite link: {devInviteUrl}</p>
      )}
      {!isInviteDialogOpen && error && (
        <AdminStatusText tone="error">{error}</AdminStatusText>
      )}

      <AdminCard>
        <h2 className={classes.CardTitle}>Invitations</h2>

        {isLoading && <AdminStatusText>Loading invites...</AdminStatusText>}
        {!isLoading && invites.length === 0 && (
          <AdminStatusText>No invites yet.</AdminStatusText>
        )}

        <div className={classes.InviteList}>
          {invites.map((invite) => (
            <article className={classes.InviteRow} key={invite.id}>
              <div>
                <strong className={classes.Email}>{invite.email}</strong>
                <p className={classes.Meta}>
                  {invite.role} · {invite.status} · expires{' '}
                  {formatShortDateTime(invite.expiresAt)}
                </p>
              </div>

              {invite.status === 'pending' && (
                <AdminButton
                  variant="danger"
                  type="button"
                  onClick={() => revoke(invite.id)}
                >
                  Revoke
                </AdminButton>
              )}
            </article>
          ))}
        </div>
      </AdminCard>
    </AdminLayout>
  );
};

export default AdminStaff;
