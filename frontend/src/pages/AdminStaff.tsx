import AdminLayout from '../components/Admin/AdminLayout';
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
  const {
    invites,
    email,
    setEmail,
    role,
    setRole,
    isLoading,
    isSubmitting,
    error,
    message,
    devInviteUrl,
    submit,
    revoke,
    refresh,
  } = useAdminStaffPage();

  return (
    <AdminLayout
      title="Staff"
      action={
        <button className={classes.SecondaryButton} type="button" onClick={refresh}>
          Refresh
        </button>
      }
    >
      <section className={classes.Card}>
        <h2 className={classes.CardTitle}>Invite staff</h2>
        <form className={classes.Form} onSubmit={submit}>
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
            <select
              className={classes.Input}
              value={role}
              onChange={(event) => setRole(event.target.value as 'staff' | 'admin')}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button className={classes.PrimaryButton} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send invite'}
          </button>
        </form>

        {message && <p className={classes.Success}>{message}</p>}
        {devInviteUrl && (
          <p className={classes.DevLink}>Dev invite link: {devInviteUrl}</p>
        )}
        {error && <p className={classes.Error}>{error}</p>}
      </section>

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
