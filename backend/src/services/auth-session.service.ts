import { ServiceError } from '../errors/ServiceError';
import type { AuthenticatedUser } from '../types/auth';
import { signAuthToken } from '../utils/token';
import { createSecureToken, hashToken } from '../utils/secure-token';
import { toPublicUser } from '../utils/public-user';
import { authSessionRepository } from '../repositories/auth-session.repository';
import { userRepository } from '../repositories/user.repository';
import { TTL_MS } from '../config/ttl';

export interface SessionAuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export const createAuthSession = async (
  user: AuthenticatedUser,
): Promise<SessionAuthResult> => {
  const refreshToken = createSecureToken();

  await authSessionRepository.create({
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + TTL_MS.REFRESH_SESSION),
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

  const session = await authSessionRepository.findByRefreshTokenHash(
    hashToken(refreshToken),
  );

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new ServiceError('Session expired', 401);
  }

  const user = await userRepository.findById(String(session.userId));

  if (!user) {
    session.revokedAt = new Date();
    await authSessionRepository.save(session);
    throw new ServiceError('User no longer exists', 401);
  }

  session.rotatedAt = new Date();
  session.revokedAt = new Date();
  await authSessionRepository.save(session);

  return createAuthSession(toPublicUser(user));
};

export const revokeAuthSession = async (refreshToken: string) => {
  if (!refreshToken) {
    return;
  }

  await authSessionRepository.revokeByRefreshTokenHash(hashToken(refreshToken));
};

export const revokeUserSessions = async (userId: string) => {
  await authSessionRepository.revokeActiveByUserId(userId);
};
