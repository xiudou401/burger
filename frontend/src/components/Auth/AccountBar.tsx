import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { BRAND_INITIAL, BRAND_NAME } from '../../constants/brand';
import AccountControls from './AccountControls';
import classes from './AccountBar.module.css';

interface AccountBarProps {
  variant?: 'default' | 'hero' | 'admin';
  title?: string;
  to?: string;
  showVerifyButton?: boolean;
}

const AccountBar = ({
  variant = 'default',
  title = BRAND_NAME,
  to = '/',
  showVerifyButton = true,
}: AccountBarProps) => {
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);

  const variantClass =
    {
      default: '',
      hero: ` ${classes.HeroAccountBar}`,
      admin: ` ${classes.AdminAccountBar}`,
    }[variant] ?? '';
  const accountBarClass = `${classes.AccountBar}${variantClass}`;

  return (
    <header className={accountBarClass}>
      <Link className={classes.Brand} to={to}>
        <span className={classes.Mark}>{BRAND_INITIAL}</span>
        <span className={classes.BrandCopy}>
          <span className={classes.BrandText}>{title}</span>
        </span>
      </Link>

      {isAuthenticated ? (
        <AccountControls
          variant={variant}
          showVerifyButton={showVerifyButton}
        />
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
