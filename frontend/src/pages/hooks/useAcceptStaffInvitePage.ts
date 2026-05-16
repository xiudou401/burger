import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptStaffInvite } from '../../api/staff-invites';
import { useAuth } from '../../store/auth/hooks/useAuth';

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
      localStorage.setItem('pendingStaffInviteToken', token);
    }
  }, [token]);

  const accept = async () => {
    const inviteToken = token || localStorage.getItem('pendingStaffInviteToken') || '';

    if (!inviteToken) {
      setError('Invite token is missing');
      return;
    }

    setIsAccepting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await acceptStaffInvite(inviteToken);
      login(res.accessToken, res.user);
      localStorage.removeItem('pendingStaffInviteToken');
      setMessage('Invite accepted');
      navigate('/admin/orders', { replace: true });
    } catch (err) {
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
