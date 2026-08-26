import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './AdminStaff.module.css';
import { useAdminStaffPage } from './hooks/useAdminStaffPage';
import AdminStaffInviteDialog from './AdminStaffInviteDialog';
import AdminStaffInviteList from './AdminStaffInviteList';

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
        <AdminStaffInviteDialog
          email={email}
          role={role}
          isSubmitting={isSubmitting}
          error={error}
          onEmailChange={setEmail}
          onSubmit={submitInvite}
          onClose={closeInviteDialog}
        />
      )}

      {message && <AdminStatusText tone="success">{message}</AdminStatusText>}
      {devInviteUrl && (
        <p className={classes.DevLink}>Dev invite link: {devInviteUrl}</p>
      )}
      {!isInviteDialogOpen && error && (
        <AdminStatusText tone="error">{error}</AdminStatusText>
      )}

      <AdminStaffInviteList
        invites={invites}
        isLoading={isLoading}
        onRevoke={revoke}
      />
    </AdminLayout>
  );
};

export default AdminStaff;
