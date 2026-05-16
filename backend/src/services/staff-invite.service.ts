import { Types } from 'mongoose';
import { ServiceError } from '../errors/ServiceError';
import {
  StaffInviteModel,
  StaffInviteRole,
  StaffInviteStatus,
} from '../models/staff-invite.model';
import { UserModel } from '../models/user.model';
import { createSecureToken, hashToken } from '../utils/secure-token';
import { sendStaffInviteEmail } from './email.service';
import { signAuthToken } from '../utils/token';
import type { AuthenticatedUser } from '../types/auth';
import { env } from '../config/env';

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

const parseInviteRole = (role: string): StaffInviteRole => {
  if (role !== 'staff' && role !== 'admin') {
    throw new ServiceError('Invalid staff role', 400);
  }

  return role;
};

const toPublicInvite = (invite: StaffInviteDoc): PublicStaffInvite => ({
  id: String(invite._id),
  email: invite.email,
  role: invite.role,
  status: invite.status,
  expiresAt: invite.expiresAt,
  acceptedAt: invite.acceptedAt,
  createdAt: invite.createdAt,
});

const toPublicUser = (user: {
  _id: unknown;
  email?: string;
  name: string;
  role?: 'customer' | 'admin' | 'staff';
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}): AuthenticatedUser => ({
  id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role ?? 'customer',
  emailVerified: user.emailVerified,
  phone: user.phone,
  phoneVerified: user.phoneVerified,
});

export const createStaffInvite = async ({
  email,
  role,
  invitedBy,
}: {
  email: string;
  role: string;
  invitedBy: string;
}): Promise<PublicStaffInvite & { token?: string }> => {
  const normalizedEmail = normalizeEmail(email ?? '');

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new ServiceError('Invalid email', 400);
  }

  if (!Types.ObjectId.isValid(invitedBy)) {
    throw new ServiceError('Invalid inviter', 400);
  }

  const parsedRole = parseInviteRole(role);
  const token = createSecureToken();

  await StaffInviteModel.updateMany(
    { email: normalizedEmail, status: 'pending' },
    { $set: { status: 'revoked' } },
  );

  const invite = await StaffInviteModel.create({
    email: normalizedEmail,
    role: parsedRole,
    tokenHash: hashToken(token),
    invitedBy: new Types.ObjectId(invitedBy),
    status: 'pending',
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await sendStaffInviteEmail({
    email: normalizedEmail,
    role: parsedRole,
    token,
  });

  return {
    ...toPublicInvite(invite),
    ...(isDevEmailMode() ? { token } : {}),
  };
};

export const listStaffInvites = async (): Promise<PublicStaffInvite[]> => {
  const invites = await StaffInviteModel.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
    .exec();

  return invites.map(toPublicInvite);
};

export const revokeStaffInvite = async (
  inviteId: string,
): Promise<PublicStaffInvite> => {
  if (!Types.ObjectId.isValid(inviteId)) {
    throw new ServiceError('Invite not found', 404);
  }

  const invite = await StaffInviteModel.findById(inviteId).exec();

  if (!invite) {
    throw new ServiceError('Invite not found', 404);
  }

  if (invite.status === 'pending') {
    invite.status = 'revoked';
    await invite.save();
  }

  return toPublicInvite(invite);
};

export const acceptStaffInvite = async ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}): Promise<{
  accessToken: string;
  user: AuthenticatedUser;
  invite: PublicStaffInvite;
}> => {
  if (!token) {
    throw new ServiceError('Invite token is required', 400);
  }

  const invite = await StaffInviteModel.findOne({
    tokenHash: hashToken(token),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .select('+tokenHash')
    .exec();

  if (!invite) {
    throw new ServiceError('Invite link is invalid or expired', 400);
  }

  const user = await UserModel.findById(userId).exec();

  if (!user?.email) {
    throw new ServiceError('Sign in with the invited email first', 400);
  }

  if (normalizeEmail(user.email) !== invite.email) {
    throw new ServiceError('This invite belongs to another email', 403);
  }

  user.role = invite.role;
  user.emailVerified = true;
  await user.save();

  invite.status = 'accepted';
  invite.acceptedAt = new Date();
  await invite.save();

  const publicUser = toPublicUser(user);

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
      phone: publicUser.phone,
    }),
    user: publicUser,
    invite: toPublicInvite(invite),
  };
};
