import { Link } from 'react-router-dom';
import { resendVerificationEmail } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { hasPermission } from '../../types/permissions';
import { useToast } from '../UI/Toast/ToastContext';
import classes from './AccountControls.module.css';

interface AccountControlsProps {
  variant?: 'default' | 'hero' | 'admin';
  showMemberStatus?: boolean;
  memberStatusLabel?: string;
  showVerifyButton?: boolean;
}

const formatRoleLabel = (role: string | undefined) => {
  if (!role) return 'Staff';

  return role.charAt(0).toUpperCase() + role.slice(1);
};

const AccountControls = ({
  variant = 'default',
  showMemberStatus = true,
  memberStatusLabel,
  showVerifyButton = true,
}: AccountControlsProps) => {
  const user = useAuth((ctx) => ctx.user);
  const logout = useAuth((ctx) => ctx.logout);
  const { showToast } = useToast();

  if (!user) return null;

  const initial = user.name?.trim().charAt(0).toUpperCase() || 'S';
  const memberStatus = user.email
    ? user.emailVerified
      ? 'Ready to order'
      : 'Email not verified'
    : user.phoneVerified
      ? 'Phone verified'
      : 'Phone login';
  const hasAdminAccess = hasPermission(user, 'view_orders');
  const displayedMemberStatus =
    memberStatusLabel ??
    (hasAdminAccess ? formatRoleLabel(user.role) : memberStatus);
  const showConsoleLink = variant !== 'admin' && hasAdminAccess;
  const showStorefrontLink = variant === 'admin';
  const accountControlsClass =
    variant === 'default'
      ? classes.AccountControls
      : `${classes.AccountControls} ${classes[variant]}`;

  const resendVerification = async () => {
    try {
      const res = await resendVerificationEmail();
      showToast({ message: res.message, tone: 'success' });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Could not send email',
        tone: 'error',
      });
    }
  };

  return (
    <div className={accountControlsClass}>
      <Link className={classes.Avatar} to="/profile" aria-label="View profile">
        {initial}
      </Link>
      <div className={classes.UserText}>
        <span className={classes.Greeting}>Hi, {user.name}</span>
        {showMemberStatus && (
          <span className={classes.Member}>{displayedMemberStatus}</span>
        )}
      </div>
      {showVerifyButton && user.email && !user.emailVerified && (
        <button
          className={classes.VerifyButton}
          type="button"
          onClick={resendVerification}
        >
          Verify
        </button>
      )}
      {showConsoleLink && (
        <Link className={classes.ConsoleLink} to="/admin/orders">
          Console
        </Link>
      )}
      {showStorefrontLink && (
        <Link className={classes.StorefrontLink} to="/">
          <span className={classes.StorefrontLabel}>Storefront</span>
          <span className={classes.StorefrontShortLabel}>Store</span>
        </Link>
      )}
      <button className={classes.Logout} type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default AccountControls;
