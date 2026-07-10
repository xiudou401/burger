import { useEffect, useRef, useState } from 'react';
import { resendVerificationEmail, verifyEmail } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';

export type VerifyEmailTone = 'error' | 'info' | 'success';

export const useVerifyEmailToken = (
  token: string,
  emailDelivery?: string | null,
) => {
  const user = useAuth((ctx) => ctx.user);
  const updateUser = useAuth((ctx) => ctx.updateUser);
  const didVerifyRef = useRef(false);
  const [message, setMessage] = useState('Checking your verification link...');
  const [tone, setTone] = useState<VerifyEmailTone>('info');
  const [isResending, setIsResending] = useState(false);
  const canResend = Boolean(user?.email && !user.emailVerified);

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
      setTone('info');
      return;
    }

    const tokenToVerify = token;
    window.history.replaceState({}, '', '/verify-email');

    verifyEmail(tokenToVerify)
      .then((res) => {
        setMessage(res.message);
        setTone('success');

        if (user && res.user && user.id === res.user.id) {
          updateUser(res.user);
        }
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Verification failed');
        setTone('error');
      });
  }, [emailDelivery, token, updateUser, user]);

  const resendVerification = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);

    try {
      const res = await resendVerificationEmail();
      setMessage(res.message);
      setTone('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not send email');
      setTone('error');
    } finally {
      setIsResending(false);
    }
  };

  return {
    canResend,
    isResending,
    message,
    resendVerification,
    tone,
  };
};
