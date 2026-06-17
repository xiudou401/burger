import { useEffect, useRef, useState } from 'react';
import { verifyEmail } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';

export const useVerifyEmailToken = (
  token: string,
  emailDelivery?: string | null,
) => {
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
      setMessage(
        emailDelivery === 'failed'
          ? 'Your account was created, but the verification email could not be sent. Please request a new verification email from your account.'
          : 'Check your email for the verification link.',
      );
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
  }, [accessToken, emailDelivery, loginFn, token, user]);

  return {
    message,
    isError,
  };
};
