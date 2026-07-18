import { FormEvent, useCallback, useState } from 'react';
import {
  createStaffInvite,
  fetchStaffInvites,
  revokeStaffInvite,
} from '../../api/staff-invites';
import type { StaffInvite } from '../../types/staff-invite';
import { useAdminResource } from './useAdminResource';

const STAFF_INVITE_ROLE = 'staff' as const;

export const useAdminStaffPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devInviteUrl, setDevInviteUrl] = useState<string | null>(null);

  const loadInvites = useCallback(async (signal: AbortSignal) => {
    const res = await fetchStaffInvites(signal);
    return res.invites;
  }, []);

  const {
    data: invites,
    setData: setInvites,
    isLoading,
    error,
    setError,
    refresh,
  } = useAdminResource<StaffInvite[]>({
    initialData: [],
    load: loadInvites,
    errorMessage: 'Could not load invites',
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    setDevInviteUrl(null);

    try {
      const res = await createStaffInvite(email, STAFF_INVITE_ROLE);
      setInvites((current) => [res.invite, ...current]);
      setMessage(`Invite sent to ${res.invite.email}`);
      setEmail('');

      if (res.invite.token) {
        setDevInviteUrl(
          `${window.location.origin}/admin/invitations/accept?token=${res.invite.token}`,
        );
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invite');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const revoke = async (inviteId: string) => {
    setError(null);

    try {
      const res = await revokeStaffInvite(inviteId);
      setInvites((current) =>
        current.map((invite) => (invite.id === inviteId ? res.invite : invite)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke invite');
    }
  };

  return {
    invites,
    email,
    setEmail,
    role: STAFF_INVITE_ROLE,
    isLoading,
    isSubmitting,
    error,
    message,
    devInviteUrl,
    submit,
    revoke,
    refresh,
  };
};
