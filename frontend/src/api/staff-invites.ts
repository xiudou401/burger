import { request } from './request';
import type {
  AcceptStaffInviteResponse,
  StaffInvite,
  StaffInviteRole,
} from '../types/staff-invite';

export const fetchStaffInvites = () => {
  return request<{ invites: StaffInvite[] }>('/staff-invites');
};

export const createStaffInvite = (email: string, role: StaffInviteRole) => {
  return request<{ invite: StaffInvite }>('/staff-invites', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
};

export const revokeStaffInvite = (inviteId: string) => {
  return request<{ invite: StaffInvite }>(`/staff-invites/${inviteId}/revoke`, {
    method: 'POST',
  });
};

export const acceptStaffInvite = (token: string) => {
  return request<AcceptStaffInviteResponse>('/staff-invites/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
};
