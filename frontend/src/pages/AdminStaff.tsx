import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import Backdrop from '../components/UI/Backdrop/Backdrop';
import classes from './AdminStaff.module.css';
import { useAdminStaffPage } from './hooks/useAdminStaffPage';

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

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
          <button
            className={classes.PrimaryButton}
            type="button"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            Invite staff
          </button>
          <AdminRefreshButton onClick={refresh} />
        </div>
      }
    >
      {isInviteDialogOpen && (
        <Backdrop className={classes.DialogBackdrop}>
          <section
            className={classes.Dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-staff-title"
          >
            <h2 id="invite-staff-title" className={classes.CardTitle}>
              Invite staff
            </h2>

            <form className={classes.Form} onSubmit={submitInvite}>
              <label className={classes.Field}>
                Email
                <input
                  className={classes.Input}
                  type="email"
                  value={email}
                  required
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className={classes.Field}>
                Role
                <input
                  className={classes.Input}
                  type="text"
                  value={role}
                  readOnly
                />
              </label>

              {error && <p className={classes.Error}>{error}</p>}

              <div className={classes.FormActions}>
                <button
                  className={classes.PrimaryButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send invite'}
                </button>
                <button
                  className={classes.SecondaryButton}
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeInviteDialog}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </Backdrop>
      )}

      {message && <p className={classes.Success}>{message}</p>}
      {devInviteUrl && (
        <p className={classes.DevLink}>Dev invite link: {devInviteUrl}</p>
      )}
      {!isInviteDialogOpen && error && <p className={classes.Error}>{error}</p>}

      <section className={classes.Card}>
        <h2 className={classes.CardTitle}>Invitations</h2>

        {isLoading && <p className={classes.StateText}>Loading invites...</p>}
        {!isLoading && invites.length === 0 && (
          <p className={classes.StateText}>No invites yet.</p>
        )}

        <div className={classes.InviteList}>
          {invites.map((invite) => (
            <article className={classes.InviteRow} key={invite.id}>
              <div>
                <strong className={classes.Email}>{invite.email}</strong>
                <p className={classes.Meta}>
                  {invite.role} · {invite.status} · expires{' '}
                  {formatDate(invite.expiresAt)}
                </p>
              </div>

              {invite.status === 'pending' && (
                <button
                  className={classes.DangerButton}
                  type="button"
                  onClick={() => revoke(invite.id)}
                >
                  Revoke
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminStaff;
