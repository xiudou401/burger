import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AuthHeader,
  AuthStatus,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useAuth } from '../store/auth/hooks/useAuth';
import type { User } from '../types/auth';

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
    <AuthCenteredPage>
      <AuthHeader title="Signing you in" subtitle="Finishing your secure sign in." />

      {error ? (
        <>
          <AuthStatus tone="error">{error}</AuthStatus>
          <AuthSwitch>
            Back to <Link to="/login">log in</Link>
          </AuthSwitch>
        </>
      ) : (
        <AuthStatus tone="success">Almost there...</AuthStatus>
      )}
    </AuthCenteredPage>
  );
};

export default OAuthCallback;
