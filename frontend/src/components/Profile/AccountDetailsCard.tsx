import type { User } from '../../types/auth';
import classes from './AccountDetailsCard.module.css';

interface AccountDetailsCardProps {
  user: User | null;
  verificationMessage: string | null;
  verificationError: string | null;
  isSendingVerification: boolean;
  onResendVerification: () => void;
}

const AccountDetailsCard = ({
  user,
  verificationMessage,
  verificationError,
  isSendingVerification,
  onResendVerification,
}: AccountDetailsCardProps) => {
  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Account details</h2>
        <span className={classes.Badge}>
          {user?.emailVerified ? 'Verified' : 'Needs verification'}
        </span>
      </div>

      <div className={classes.Rows}>
        <div className={classes.Row}>
          <span className={classes.Label}>Name</span>
          <span className={classes.Value}>{user?.name}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Email</span>
          <span className={classes.Value}>{user?.email}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Email status</span>
          <span className={classes.Value}>
            {user?.emailVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>
      </div>

      {!user?.emailVerified && (
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
