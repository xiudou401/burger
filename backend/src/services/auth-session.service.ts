import { Types } from 'mongoose';
import { AuthSessionModel } from '../models/auth-session.model';
import { UserModel } from '../models/user.model';
import { ServiceError } from '../errors/ServiceError';
import type { AuthenticatedUser } from '../types/auth';
import { signAuthToken } from '../utils/token';
import { createSecureToken, hashToken } from '../utils/secure-token';

export const REFRESH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export interface SessionAuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

const toPublicUser = (user: {
  _id: unknown;
  email?: string;
  name: string;
  role?: 'customer' | 'admin' | 'staff';
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}): AuthenticatedUser => {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role ?? 'customer',
    emailVerified: user.emailVerified,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
  };
};

export const createAuthSession = async (
  user: AuthenticatedUser,
): Promise<SessionAuthResult> => {
  const refreshToken = createSecureToken();

  await AuthSessionModel.create({
    userId: new Types.ObjectId(user.id),
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_SESSION_TTL_MS),
  });

  return {
    accessToken: signAuthToken({
      sub: user.id,
      email: user.email,
      phone: user.phone,
    }),
    refreshToken,
    user,
  };
};

export const rotateAuthSession = async (
  refreshToken: string,
): Promise<SessionAuthResult> => {
  if (!refreshToken) {
    throw new ServiceError('Refresh token required', 401);
  }

  const session = await AuthSessionModel.findOne({
    refreshTokenHash: hashToken(refreshToken),
  })
    .select('+refreshTokenHash')
    .exec();

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new ServiceError('Session expired', 401);
  }

  const user = await UserModel.findById(session.userId).exec();

  if (!user) {
    session.revokedAt = new Date();
    await session.save();
    throw new ServiceError('User no longer exists', 401);
  }

  session.rotatedAt = new Date();
  session.revokedAt = new Date();
  await session.save();

  return createAuthSession(toPublicUser(user));
};

export const revokeAuthSession = async (refreshToken: string) => {
  if (!refreshToken) {
    return;
  }

  await AuthSessionModel.findOneAndUpdate(
    {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: { $exists: false },
    },
    { revokedAt: new Date() },
  ).exec();
};

export const revokeUserSessions = async (userId: string) => {
  await AuthSessionModel.updateMany(
    {
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
    },
    { revokedAt: new Date() },
  ).exec();
};
