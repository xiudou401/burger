import { randomUUID } from 'crypto';
import { ConcurrentRefreshError } from '../errors/ConcurrentRefreshError';
import { ServiceError } from '../errors/ServiceError';
import type { AuthenticatedUser } from '../types/auth';
import { signAuthToken } from '../utils/token';
import { createSecureToken, hashToken } from '../utils/secure-token';
import { toPublicUser } from '../utils/public-user';
import { authSessionRepository } from '../repositories/auth-session.repository';
import { userRepository } from '../repositories/user.repository';
import { TTL_MS } from '../config/ttl';
import { appLogger } from '../utils/logger';

export interface SessionAuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

interface CreateSessionOptions {
  familyId?: string;
  parentSessionId?: string;
}

const createSession = async (
  user: AuthenticatedUser,
  options: CreateSessionOptions = {},
) => {
  const refreshToken = createSecureToken();
  const familyId = options.familyId ?? randomUUID();

  const session = await authSessionRepository.create({
    userId: user.id,
    familyId,
    parentSessionId: options.parentSessionId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + TTL_MS.REFRESH_SESSION),
  });

  return {
    result: {
      accessToken: await signAuthToken({
        sub: user.id,
        email: user.email,
      }),
      refreshToken,
      user,
    },
    session,
  };
};

export const createAuthSession = async (
  user: AuthenticatedUser,
): Promise<SessionAuthResult> => {
  const { result } = await createSession(user);

  return result;
};

const isRefreshTokenReuse = (
  session: {
    familyId?: string;
    rotatedAt?: Date;
    replacedBySessionId?: unknown;
  },
  now = new Date(),
) => {
  if (!session.familyId || !session.rotatedAt || !session.replacedBySessionId) {
    return false;
  }

  return (
    now.getTime() - session.rotatedAt.getTime() > TTL_MS.REFRESH_REUSE_GRACE
  );
};

const isConcurrentRefresh = (
  session: { rotatedAt?: Date },
  now = new Date(),
) => {
  if (!session.rotatedAt) {
    return false;
  }

  const elapsedMs = now.getTime() - session.rotatedAt.getTime();

  return elapsedMs >= 0 && elapsedMs <= TTL_MS.REFRESH_REUSE_GRACE;
};

const restoreConsumedSession = async (sessionId: string) => {
  try {
    await authSessionRepository.restoreConsumedById(sessionId);
  } catch (error) {
    appLogger.error('refresh_session_restore_failed', {
      sessionId,
      error,
    });
  }
};

const revokeReplacementSession = async (sessionId: string) => {
  try {
    await authSessionRepository.revokeById(sessionId);
  } catch (error) {
    appLogger.error('refresh_replacement_revoke_failed', {
      sessionId,
      error,
    });
  }
};

export const rotateAuthSession = async (
  refreshToken: string,
): Promise<SessionAuthResult> => {
  /**
   * Refresh flow:
   * 1. Active refresh tokens are atomically consumed so each token rotates once.
   * 2. The replacement session stays in the same family as the consumed token.
   * 3. Reusing the old token within the grace window is treated as a concurrent refresh.
   * 4. Reusing it after the grace window revokes the active session family.
   */
  if (!refreshToken) {
    throw new ServiceError('Refresh token required', 401);
  }

  const refreshTokenHash = hashToken(refreshToken);
  const consumedSession =
    await authSessionRepository.consumeActiveByRefreshTokenHash(
      refreshTokenHash,
    );

  if (!consumedSession) {
    const previousSession =
      await authSessionRepository.findByRefreshTokenHash(refreshTokenHash);
    const previousFamilyId = previousSession?.familyId;

    if (previousSession && isConcurrentRefresh(previousSession)) {
      throw new ConcurrentRefreshError();
    }

    if (
      previousSession &&
      previousFamilyId &&
      isRefreshTokenReuse(previousSession)
    ) {
      await authSessionRepository.revokeActiveByFamilyId(previousFamilyId);
      appLogger.warn('refresh_token_reuse_detected', {
        familyId: previousFamilyId,
        userId: String(previousSession.userId),
      });
      throw new ServiceError('Session reuse detected', 401);
    }

    throw new ServiceError('Session expired', 401);
  }

  const user = await userRepository.findById(String(consumedSession.userId));

  if (!user) {
    consumedSession.revokedAt = new Date();
    await authSessionRepository.save(consumedSession);
    throw new ServiceError('User no longer exists', 401);
  }

  if (user.status === 'disabled') {
    consumedSession.revokedAt = new Date();
    await authSessionRepository.save(consumedSession);
    throw new ServiceError('Account disabled', 403);
  }

  const refreshFamilyId = consumedSession.familyId ?? randomUUID();
  let createdReplacementSession: { _id: unknown };
  let result: SessionAuthResult;

  try {
    const replacement = await createSession(toPublicUser(user), {
      familyId: refreshFamilyId,
      parentSessionId: String(consumedSession._id),
    });

    createdReplacementSession = replacement.session;
    result = replacement.result;
  } catch (error) {
    await restoreConsumedSession(String(consumedSession._id));
    throw error;
  }

  try {
    await authSessionRepository.linkReplacement(
      String(consumedSession._id),
      refreshFamilyId,
      String(createdReplacementSession._id),
    );
  } catch (error) {
    await revokeReplacementSession(String(createdReplacementSession._id));
    await restoreConsumedSession(String(consumedSession._id));
    throw error;
  }

  return result;
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
