import { Link } from 'react-router-dom';
import { resendVerificationEmail } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import classes from './AccountBar.module.css';

const AccountBar = () => {
  const user = useAuth((ctx) => ctx.user);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const logout = useAuth((ctx) => ctx.logout);

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'B';

  const resendVerification = async () => {
    try {
      const res = await resendVerificationEmail();
      alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not send email');
    }
  };

  return (
    <header className={classes.AccountBar}>
      <Link className={classes.Brand} to="/">
        <span className={classes.Mark}>M</span>
        <span className={classes.BrandText}>Burger Club</span>
      </Link>

      {isAuthenticated && user ? (
        <div className={classes.UserArea}>
          <div className={classes.Avatar}>{initial}</div>
          <div className={classes.UserText}>
            <span className={classes.Greeting}>Hi, {user.name}</span>
            <span className={classes.Member}>
              {user.emailVerified ? 'Ready to order' : 'Email not verified'}
            </span>
          </div>
          {!user.emailVerified && (
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
