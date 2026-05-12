import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth/hooks/useAuth';
import type { User } from '../types/auth';
import classes from './Auth.module.css';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const loginFn = useAuth((ctx) => ctx.login);
  const didHandleRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (didHandleRef.current) {
      return;
    }

    didHandleRef.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('accessToken');
    const rawUser = params.get('user');

    if (!accessToken || !rawUser) {
      setError('Sign in did not return account details.');
      return;
    }

    try {
      const user = JSON.parse(rawUser) as User;
      loginFn(accessToken, user);
      navigate('/', { replace: true });
    } catch {
      setError('Could not finish sign in.');
    }
  }, [loginFn, navigate]);

  return (
    <main className={classes.CenterPage}>
      <section className={classes.SimpleCard}>
        <div className={classes.Logo}>M</div>
        <header className={classes.FormHeader}>
          <h1>Signing you in</h1>
          <p>Finishing your secure sign in.</p>
        </header>

        {error ? (
          <>
            <p className={classes.Error}>{error}</p>
            <p className={classes.Switch}>
              Back to <Link to="/login">log in</Link>
            </p>
          </>
        ) : (
          <p className={classes.Success}>Almost there...</p>
        )}
      </section>
    </main>
  );
};

export default OAuthCallback;
