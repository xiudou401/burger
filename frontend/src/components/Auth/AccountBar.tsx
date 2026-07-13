import { Link } from 'react-router-dom';
import { resendVerificationEmail } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { useToast } from '../UI/Toast/ToastContext';
import classes from './AccountBar.module.css';

interface AccountBarProps {
  variant?: 'default' | 'hero';
}

const AccountBar = ({ variant = 'default' }: AccountBarProps) => {
  const user = useAuth((ctx) => ctx.user);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const logout = useAuth((ctx) => ctx.logout);
  const { showToast } = useToast();

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'S';
  const memberStatus = user?.email
    ? user.emailVerified
      ? 'Ready to order'
      : 'Email not verified'
    : user?.phoneVerified
      ? 'Phone verified'
      : 'Phone login';

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

  const accountBarClass =
    variant === 'hero'
      ? `${classes.AccountBar} ${classes.HeroAccountBar}`
      : classes.AccountBar;

  return (
    <header className={accountBarClass}>
      <Link className={classes.Brand} to="/">
        <span className={classes.Mark}>S</span>
        <span className={classes.BrandCopy}>
          <span className={classes.BrandText}>Sydney Burger</span>
          <span className={classes.BrandSubtext}>
            Sydney pickup and delivery
          </span>
        </span>
      </Link>

      {isAuthenticated && user ? (
        <div className={classes.UserArea}>
          <div className={classes.Avatar}>{initial}</div>
          <div className={classes.UserText}>
            <span className={classes.Greeting}>Hi, {user.name}</span>
            <span className={classes.Member}>{memberStatus}</span>
          </div>
          {user.email && !user.emailVerified && (
            <button
              className={classes.VerifyButton}
              type="button"
              onClick={resendVerification}
            >
              Verify
            </button>
          )}
          <Link className={classes.ProfileLink} to="/profile">
            Profile
          </Link>
          <button className={classes.Logout} type="button" onClick={logout}>
            Logout
          </button>
        </div>
      ) : (
        <nav className={classes.AuthLinks} aria-label="Account">
          <Link className={classes.LoginLink} to="/login">
            Log in
          </Link>
          <Link className={classes.JoinLink} to="/signup">
            Join now
          </Link>
        </nav>
      )}
    </header>
  );
};

export default AccountBar;
