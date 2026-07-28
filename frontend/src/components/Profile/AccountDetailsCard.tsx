import type { User } from '../../types/auth';
import { hasPermission } from '../../types/permissions';
import ProfileStatusBadge from './ProfileStatusBadge';
import classes from './AccountDetailsCard.module.css';

interface AccountDetailsCardProps {
  user: User | null;
  verificationMessage: string | null;
  verificationError: string | null;
  isSendingVerification: boolean;
  onResendVerification: () => void;
}

const formatRoleLabel = (role: User['role'] | undefined) => {
  if (!role) return 'Customer';

  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getAccountStatusLabel = (user: User | null) => {
  if (!user) return 'Not available';

  if (user.status === 'disabled') return 'Disabled';

  if (hasPermission(user, 'view_orders')) {
    return `${formatRoleLabel(user.role)} account`;
  }

  if (user.email && !user.emailVerified) {
    return 'Email verification required';
  }

  return 'Ready to order';
};

const AccountDetailsCard = ({
  user,
  verificationMessage,
  verificationError,
  isSendingVerification,
  onResendVerification,
}: AccountDetailsCardProps) => {
  const isEmailVerified = Boolean(user?.emailVerified);

  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Account details</h2>
        <ProfileStatusBadge variant={isEmailVerified ? 'success' : 'warning'}>
          {isEmailVerified ? 'Verified' : 'Needs verification'}
        </ProfileStatusBadge>
      </div>

      <div className={classes.Rows}>
        <div className={classes.Row}>
          <span className={classes.Label}>Name</span>
          <span className={classes.Value}>{user?.name}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Email</span>
          <span className={classes.Value}>{user?.email ?? 'Not linked'}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Role</span>
          <span className={classes.Value}>{formatRoleLabel(user?.role)}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Account status</span>
          <span className={classes.Value}>{getAccountStatusLabel(user)}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Email status</span>
          <span className={classes.Value}>
            {user?.email
              ? user.emailVerified
                ? 'Verified'
                : 'Not verified'
              : 'Not linked'}
          </span>
        </div>
      </div>

      {user?.email && !user.emailVerified && (
        <>
          <div className={classes.Actions}>
            <button
              className={classes.PrimaryAction}
              type="button"
              onClick={onResendVerification}
              disabled={isSendingVerification}
            >
              {isSendingVerification ? 'Sending...' : 'Send verification'}
            </button>
          </div>

          {verificationMessage && (
            <p className={classes.StatusMessage}>{verificationMessage}</p>
          )}
          {verificationError && (
            <p className={classes.ErrorMessage}>{verificationError}</p>
          )}
        </>
      )}
    </section>
  );
};

export default AccountDetailsCard;
