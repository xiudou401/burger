import { useEffect, useRef, useState } from 'react';
import { verifyEmail } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';

export const useVerifyEmailToken = (token: string) => {
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

  return {
    message,
    isError,
  };
};
