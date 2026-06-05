import { FormEvent, useEffect, useState } from 'react';
import {
  createStaffInvite,
  fetchStaffInvites,
  revokeStaffInvite,
} from '../../api/staff-invites';
import type { StaffInvite, StaffInviteRole } from '../../types/staff-invite';

export const useAdminStaffPage = () => {
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffInviteRole>('staff');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devInviteUrl, setDevInviteUrl] = useState<string | null>(null);

  const loadInvites = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchStaffInvites();
      setInvites(res.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load invites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    setDevInviteUrl(null);

    try {
      const res = await createStaffInvite(email, role);
      setInvites((current) => [res.invite, ...current]);
      setMessage(`Invite sent to ${res.invite.email}`);
      setEmail('');

      if (res.invite.token) {
        setDevInviteUrl(
          `${window.location.origin}/admin/invitations/accept?token=${res.invite.token}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invite');
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
    role,
    setRole,
    isLoading,
    isSubmitting,
    error,
    message,
    devInviteUrl,
    submit,
    revoke,
    refresh: loadInvites,
  };
};
