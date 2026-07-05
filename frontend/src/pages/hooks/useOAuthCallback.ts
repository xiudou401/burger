import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshSession } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';

const PENDING_STAFF_INVITE_TOKEN = 'pendingStaffInviteToken';

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
    const redirectTo = params.get('redirectTo');

    const finishSignIn = async () => {
      const session = await refreshSession();
      loginFn(session.accessToken, session.user);
      const pendingInviteToken = sessionStorage.getItem(
        PENDING_STAFF_INVITE_TOKEN,
      );

      if (pendingInviteToken) {
        sessionStorage.removeItem(PENDING_STAFF_INVITE_TOKEN);
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
