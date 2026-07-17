import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import AccountControls from './AccountControls';
import classes from './AccountBar.module.css';

interface AccountBarProps {
  variant?: 'default' | 'hero';
}

const AccountBar = ({ variant = 'default' }: AccountBarProps) => {
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);

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
        </span>
      </Link>

      {isAuthenticated ? (
        <AccountControls variant={variant} />
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
