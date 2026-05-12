import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import { useAuth } from '../store/auth/hooks/useAuth';
import classes from './Auth.module.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const user = useAuth((ctx) => ctx.user);
  const accessToken = useAuth((ctx) => ctx.accessToken);
  const loginFn = useAuth((ctx) => ctx.login);
  const didVerifyRef = useRef(false);
  const [message, setMessage] = useState('Checking your verification link...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (didVerifyRef.current) {
      return;
    }

    didVerifyRef.current = true;

    if (!token) {
      setMessage('Check your email for the verification link.');
      setIsError(false);
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setMessage(res.message);
        setIsError(false);

        if (user && accessToken) {
          loginFn(accessToken, {
            ...user,
            emailVerified: true,
          });
        }
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Verification failed');
        setIsError(true);
      });
  }, [accessToken, loginFn, token, user]);

  return (
    <main className={classes.CenterPage}>
      <section className={classes.SimpleCard}>
        <div className={classes.Logo}>M</div>
        <header className={classes.FormHeader}>
          <h1>Email verification</h1>
          <p>Your account security matters before checkout.</p>
        </header>

        <p className={isError ? classes.Error : classes.Success}>{message}</p>

        <p className={classes.Switch}>
          Continue to <Link to="/">menu</Link>
        </p>
      </section>
    </main>
  );
};

export default VerifyEmail;
