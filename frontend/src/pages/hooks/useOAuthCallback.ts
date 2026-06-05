import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshSession } from '../../api/auth';
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
    const rawUser = params.get('user');
    const redirectTo = params.get('redirectTo');

    if (!rawUser) {
      setError('Sign in did not return account details.');
      return;
    }

    const finishSignIn = async () => {
      const user = JSON.parse(rawUser) as User;
      const session = await refreshSession();
      loginFn(session.accessToken, user);
      const pendingInviteToken = localStorage.getItem(
        'pendingStaffInviteToken',
      );

      if (pendingInviteToken) {
        localStorage.removeItem('pendingStaffInviteToken');
        navigate(`/admin/invitations/accept?token=${pendingInviteToken}`, {
          replace: true,
        });
        return;
      }

      navigate(redirectTo || '/', { replace: true });
    };

    finishSignIn().catch(() => {
      setError('Could not finish sign in.');
    });
  }, [loginFn, navigate]);

  return {
    error,
  };
};
