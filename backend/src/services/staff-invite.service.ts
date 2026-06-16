import { ServiceError } from '../errors/ServiceError';
import {
  StaffInviteRole,
  StaffInviteStatus,
} from '../models/staff-invite.model';
import { createSecureToken, hashToken } from '../utils/secure-token';
import { sendStaffInviteEmail } from './email.service';
import { createAuthSession } from './auth-session.service';
import type { AuthenticatedUser } from '../types/auth';
import { toPublicUser } from '../utils/public-user';
import { env } from '../config/env';
import { staffInviteRepository } from '../repositories/staff-invite.repository';
import { userRepository } from '../repositories/user.repository';
import type {
  AcceptStaffInvitePayload,
  CreateStaffInvitePayload,
} from '../validation/staff-invite.schema';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const isDevEmailMode = () => !env.RESEND_API_KEY || !env.EMAIL_FROM;

export interface PublicStaffInvite {
  id: string;
  email: string;
  role: StaffInviteRole;
  status: StaffInviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

interface StaffInviteDoc {
  _id: unknown;
  email: string;
  role: StaffInviteRole;
  status: StaffInviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toPublicInvite = (invite: StaffInviteDoc): PublicStaffInvite => ({
  id: String(invite._id),
  email: invite.email,
  role: invite.role,
  status: invite.status,
  expiresAt: invite.expiresAt,
  acceptedAt: invite.acceptedAt,
  createdAt: invite.createdAt,
});

export const createStaffInvite = async ({
  email,
  role,
  invitedBy,
}: CreateStaffInvitePayload & {
  invitedBy: string;
}): Promise<PublicStaffInvite & { token?: string }> => {
  const token = createSecureToken();

  await staffInviteRepository.revokePendingByEmail(email);

  const invite = await staffInviteRepository.create({
    email,
    role,
    tokenHash: hashToken(token),
    invitedBy,
    status: 'pending',
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await sendStaffInviteEmail({
    email,
    role,
    token,
  });

  return {
    ...toPublicInvite(invite),
    ...(isDevEmailMode() ? { token } : {}),
  };
};

export const listStaffInvites = async (): Promise<PublicStaffInvite[]> => {
  const invites = await staffInviteRepository.listRecent(50);

  return invites.map(toPublicInvite);
};

export const revokeStaffInvite = async (
  inviteId: string,
): Promise<PublicStaffInvite> => {
  const invite = await staffInviteRepository.findById(inviteId);

  if (!invite) {
    throw new ServiceError('Invite not found', 404);
  }

  if (invite.status === 'pending') {
    invite.status = 'revoked';
    await staffInviteRepository.save(invite);
  }

  return toPublicInvite(invite);
};

export const acceptStaffInvite = async ({
  token,
  userId,
}: AcceptStaffInvitePayload & {
  userId: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
  invite: PublicStaffInvite;
}> => {
  const invite = await staffInviteRepository.findPendingByTokenHash(
    hashToken(token),
  );

  if (!invite) {
    throw new ServiceError('Invite link is invalid or expired', 400);
  }

  const user = await userRepository.findById(userId);

  if (!user?.email) {
    throw new ServiceError('Sign in with the invited email first', 400);
  }

  if (normalizeEmail(user.email) !== invite.email) {
    throw new ServiceError('This invite belongs to another email', 403);
  }

  user.role = invite.role;
  user.emailVerified = true;
  await userRepository.save(user);

  invite.status = 'accepted';
  invite.acceptedAt = new Date();
  await staffInviteRepository.save(invite);

  const publicUser = toPublicUser(user);
  const session = await createAuthSession(publicUser);

  return {
    ...session,
    invite: toPublicInvite(invite),
  };
};
