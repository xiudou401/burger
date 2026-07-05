import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptStaffInvite } from '../../api/staff-invites';
import { useAuth } from '../../store/auth/hooks/useAuth';

const PENDING_STAFF_INVITE_TOKEN = 'pendingStaffInviteToken';

export const useAcceptStaffInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const login = useAuth((ctx) => ctx.login);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(PENDING_STAFF_INVITE_TOKEN, token);
    }
  }, [token]);

  const accept = async () => {
    if (!token) {
      sessionStorage.removeItem(PENDING_STAFF_INVITE_TOKEN);
      setError('Invite token is missing');
      return;
    }

    setIsAccepting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await acceptStaffInvite(token);
      login(res.accessToken, res.user);
      sessionStorage.removeItem(PENDING_STAFF_INVITE_TOKEN);
      setMessage('Invite accepted');
      navigate('/admin/orders', { replace: true });
    } catch (err) {
      sessionStorage.removeItem(PENDING_STAFF_INVITE_TOKEN);
      setError(err instanceof Error ? err.message : 'Could not accept invite');
    } finally {
      setIsAccepting(false);
    }
  };

  return {
    token,
    isAuthenticated,
    isAccepting,
    message,
    error,
    accept,
  };
};
