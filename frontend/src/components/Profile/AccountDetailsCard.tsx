import type { User } from '../../types/auth';
import classes from './AccountDetailsCard.module.css';

interface AccountDetailsCardProps {
  user: User | null;
  verificationMessage: string | null;
  verificationError: string | null;
  isSendingVerification: boolean;
  onResendVerification: () => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  smsCode: string;
  onSmsCodeChange: (code: string) => void;
  smsMessage: string | null;
  smsError: string | null;
  devSmsCode: string | null;
  isSendingSms: boolean;
  isVerifyingSms: boolean;
  showPhoneVerification: boolean;
  onSendPhoneCode: () => void;
  onVerifyPhoneCode: () => void;
}

const AccountDetailsCard = ({
  user,
  verificationMessage,
  verificationError,
  isSendingVerification,
  onResendVerification,
  phone,
  onPhoneChange,
  smsCode,
  onSmsCodeChange,
  smsMessage,
  smsError,
  devSmsCode,
  isSendingSms,
  isVerifyingSms,
  showPhoneVerification,
  onSendPhoneCode,
  onVerifyPhoneCode,
}: AccountDetailsCardProps) => {
  const isContactVerified = Boolean(user?.emailVerified || user?.phoneVerified);

  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Account details</h2>
        <span className={classes.Badge}>
          {isContactVerified ? 'Verified' : 'Needs verification'}
        </span>
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
          <span className={classes.Label}>Email status</span>
          <span className={classes.Value}>
            {user?.email
              ? user.emailVerified
                ? 'Verified'
                : 'Not verified'
              : 'Not linked'}
          </span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Phone</span>
          <span className={classes.Value}>{user?.phone ?? 'Not linked'}</span>
        </div>
        <div className={classes.Row}>
          <span className={classes.Label}>Phone status</span>
          <span className={classes.Value}>
            {user?.phoneVerified ? 'Verified' : 'Not verified'}
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

      {showPhoneVerification && !user?.phoneVerified && (
        <div className={classes.PhonePanel}>
          <h3 className={classes.PanelTitle}>Link phone number</h3>
          <label className={classes.Field}>
            Phone
            <input
              className={classes.Input}
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              type="tel"
              autoComplete="tel"
              placeholder="+61412345678"
            />
          </label>
          <div className={classes.Actions}>
            <button
              className={classes.SecondaryAction}
              type="button"
              onClick={onSendPhoneCode}
              disabled={isSendingSms || !phone}
            >
              {isSendingSms ? 'Sending...' : 'Send SMS code'}
            </button>
          </div>
          <label className={classes.Field}>
            SMS code
            <input
              className={classes.Input}
              value={smsCode}
              onChange={(event) => onSmsCodeChange(event.target.value)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </label>
          <div className={classes.Actions}>
            <button
              className={classes.PrimaryAction}
              type="button"
              onClick={onVerifyPhoneCode}
              disabled={isVerifyingSms || !phone || !smsCode}
            >
              {isVerifyingSms ? 'Verifying...' : 'Verify phone'}
            </button>
          </div>
          {smsMessage && (
            <p className={classes.StatusMessage}>
              {devSmsCode
                ? `${smsMessage}. Dev code: ${devSmsCode}`
                : smsMessage}
            </p>
          )}
          {smsError && <p className={classes.ErrorMessage}>{smsError}</p>}
        </div>
      )}
    </section>
  );
};

export default AccountDetailsCard;
