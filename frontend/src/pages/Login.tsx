import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../store/auth/hooks/useAuth';
import classes from './Auth.module.css';

const API_ORIGIN = process.env.REACT_APP_API_URL ?? 'http://localhost:5001';

interface LoginLocationState {
  from?: {
    pathname: string;
    search?: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const loginFn = useAuth((ctx) => ctx.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);

      loginFn(res.accessToken, res.user);

      const state = location.state as LoginLocationState | null;
      const from = state?.from;
      const redirectTo = `${from?.pathname ?? '/'}${from?.search ?? ''}`;

      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const oauthLogin = (provider: 'google' | 'apple') => {
    window.location.assign(`${API_ORIGIN}/api/auth/oauth/${provider}`);
  };

  return (
    <main className={classes.Page}>
      <section className={classes.BrandPanel}>
        <div className={classes.Logo}>M</div>
        <div className={classes.BrandCopy}>
          <p className={classes.Eyebrow}>Burger Club</p>
          <h1 className={classes.Title}>Welcome back to big flavor.</h1>
          <p className={classes.Subtitle}>
            Sign in to keep your favorites, cart, and checkout ready for your
            next order.
          </p>
        </div>
        <div className={classes.FoodRow}>
          <div className={classes.FoodTile}>
            <img src="/img/meals/1.png" alt="" />
          </div>
          <div className={classes.FoodTile}>
            <img src="/img/meals/2.png" alt="" />
          </div>
          <div className={classes.FoodTile}>
            <img src="/img/meals/3.png" alt="" />
          </div>
        </div>
      </section>

      <section className={classes.FormPanel}>
        <div className={classes.FormCard}>
          <header className={classes.FormHeader}>
            <h1>Log in</h1>
            <p>Use your email and password to continue ordering.</p>
          </header>

          {searchParams.get('error') && (
            <p className={classes.Error}>{searchParams.get('error')}</p>
          )}

          <div className={classes.SocialStack}>
            <button
              className={classes.GoogleButton}
              type="button"
              onClick={() => oauthLogin('google')}
            >
              <span className={classes.GoogleIcon}>G</span>
              Continue with Google
            </button>
            <button
              className={classes.AppleButton}
              type="button"
              onClick={() => oauthLogin('apple')}
            >
              <span className={classes.AppleIcon}>Apple</span>
              Continue with Apple
            </button>
          </div>

          <div className={classes.Divider}>
            <span>or</span>
          </div>

          <form className={classes.Form} onSubmit={submit}>
            <label className={classes.Field}>
              Email
              <input
                className={classes.Input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className={classes.Field}>
              Password
              <input
                className={classes.Input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <Link className={classes.ForgotLink} to="/forgot-password">
              Forgot password?
            </Link>
            {error && <p className={classes.Error}>{error}</p>}
            <button
              className={classes.Submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className={classes.Switch}>
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
