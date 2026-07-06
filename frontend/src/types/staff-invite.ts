import type { User } from './auth';

export type StaffInviteRole = 'staff';
export type StaffInviteStatus = 'pending' | 'accepted' | 'revoked';

export interface StaffInvite {
  id: string;
  email: string;
  role: StaffInviteRole;
  status: StaffInviteStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  token?: string;
}

export interface AcceptStaffInviteResponse {
  accessToken: string;
  user: User;
  invite: StaffInvite;
}
