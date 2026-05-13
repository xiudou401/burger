import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { User } from '../../types/auth';

export const useOAuthCallback = () => {
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

  return {
    error,
  };
};
