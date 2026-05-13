import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import {
  AuthHeader,
  AuthStatus,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useAuth } from '../store/auth/hooks/useAuth';

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
    <AuthCenteredPage>
      <AuthHeader
        title="Email verification"
        subtitle="Your account security matters before checkout."
      />

      <AuthStatus tone={isError ? 'error' : 'success'}>{message}</AuthStatus>

      <AuthSwitch>
        Continue to <Link to="/">menu</Link>
      </AuthSwitch>
    </AuthCenteredPage>
  );
};

export default VerifyEmail;
