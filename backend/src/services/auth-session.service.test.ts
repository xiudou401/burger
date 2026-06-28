import { ServiceError } from '../errors/ServiceError';
import { ConcurrentRefreshError } from '../errors/ConcurrentRefreshError';
import { authSessionRepository } from '../repositories/auth-session.repository';
import { userRepository } from '../repositories/user.repository';
import { hashToken } from '../utils/secure-token';
import {
  createAuthSession,
  rotateAuthSession,
  revokeAuthSession,
  revokeUserSessions,
} from './auth-session.service';

jest.mock('../repositories/auth-session.repository', () => ({
  authSessionRepository: {
    create: jest.fn(),
    consumeActiveByRefreshTokenHash: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    revokeByRefreshTokenHash: jest.fn(),
    revokeActiveByFamilyId: jest.fn(),
    revokeActiveByUserId: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../utils/secure-token', () => ({
  createSecureToken: jest.fn(() => 'refresh-token'),
  hashToken: jest.fn((token: string) => `hash:${token}`),
}));

describe('auth session service', () => {
  const user = {
    id: '507f1f77bcf86cd799439011',
    email: 'pat@example.com',
    name: 'Pat',
    role: 'customer' as const,
    emailVerified: true,
    phoneVerified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a refresh session with a hashed token and access token', async () => {
    jest.mocked(authSessionRepository.create).mockResolvedValue({
      _id: 'session-1',
    } as never);

    const result = await createAuthSession(user);

    expect(authSessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        familyId: expect.any(String),
        refreshTokenHash: 'hash:refresh-token',
        expiresAt: expect.any(Date),
      }),
    );
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user).toEqual(user);
  });

  test('rotates an active refresh session and revokes the previous session', async () => {
    const session = {
      _id: 'old-session',
      userId: user.id,
      familyId: 'family-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      rotatedAt: new Date(),
      replacedBySessionId: undefined as string | undefined,
      save: jest.fn(),
    };
    const replacementSession = {
      _id: 'new-session',
    };
    const userDoc = {
      _id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };

    jest
      .mocked(authSessionRepository.consumeActiveByRefreshTokenHash)
      .mockResolvedValue(session as never);
    jest.mocked(userRepository.findById).mockResolvedValue(userDoc as never);
    jest
      .mocked(authSessionRepository.create)
      .mockResolvedValue(replacementSession as never);

    const result = await rotateAuthSession('old-refresh-token');

    expect(
      authSessionRepository.consumeActiveByRefreshTokenHash,
    ).toHaveBeenCalledWith('hash:old-refresh-token');
    expect(session.revokedAt).toBeInstanceOf(Date);
    expect(session.rotatedAt).toBeInstanceOf(Date);
    expect(authSessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        familyId: 'family-1',
        parentSessionId: 'old-session',
      }),
    );
    expect(session.replacedBySessionId).toBe('new-session');
    expect(authSessionRepository.save).toHaveBeenCalledWith(session);
    expect(result.user.id).toBe(user.id);
  });

  test('rejects missing refresh tokens with 401', async () => {
    await expect(rotateAuthSession('')).rejects.toMatchObject({
      message: 'Refresh token required',
      statusCode: 401,
    });

    expect(
      authSessionRepository.consumeActiveByRefreshTokenHash,
    ).not.toHaveBeenCalled();
  });

  test('rejects expired refresh sessions with 401', async () => {
    jest
      .mocked(authSessionRepository.consumeActiveByRefreshTokenHash)
      .mockResolvedValue(null);
    jest
      .mocked(authSessionRepository.findByRefreshTokenHash)
      .mockResolvedValue(null);

    await expect(rotateAuthSession('expired-token')).rejects.toMatchObject({
      message: 'Session expired',
      statusCode: 401,
    });
  });

  test('does not revoke a token family for a concurrent refresh inside the grace period', async () => {
    const rotatedAt = new Date();

    jest
      .mocked(authSessionRepository.consumeActiveByRefreshTokenHash)
      .mockResolvedValue(null);
    jest
      .mocked(authSessionRepository.findByRefreshTokenHash)
      .mockResolvedValue({
        userId: user.id,
        familyId: 'family-1',
        rotatedAt,
      } as never);

    await expect(rotateAuthSession('old-refresh-token')).rejects.toThrow(
      ConcurrentRefreshError,
    );

    expect(
      authSessionRepository.consumeActiveByRefreshTokenHash,
    ).toHaveBeenCalledWith('hash:old-refresh-token');
    expect(authSessionRepository.revokeActiveByFamilyId).not.toHaveBeenCalled();
    expect(authSessionRepository.create).not.toHaveBeenCalled();
  });

  test('revokes the token family when a rotated refresh token is reused', async () => {
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    jest
      .mocked(authSessionRepository.consumeActiveByRefreshTokenHash)
      .mockResolvedValue(null);
    jest
      .mocked(authSessionRepository.findByRefreshTokenHash)
      .mockResolvedValue({
        userId: user.id,
        familyId: 'family-1',
        rotatedAt: new Date(Date.now() - 10_000),
        replacedBySessionId: 'replacement-session',
      } as never);

    await expect(rotateAuthSession('replayed-token')).rejects.toMatchObject({
      message: 'Session reuse detected',
      statusCode: 401,
    });

    expect(authSessionRepository.revokeActiveByFamilyId).toHaveBeenCalledWith(
      'family-1',
    );
    expect(authSessionRepository.create).not.toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  test('revokes the consumed session when the user no longer exists', async () => {
    const session = {
      _id: 'old-session',
      userId: user.id,
      familyId: 'family-1',
      revokedAt: new Date(),
      rotatedAt: new Date(),
    };

    jest
      .mocked(authSessionRepository.consumeActiveByRefreshTokenHash)
      .mockResolvedValue(session as never);
    jest.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(rotateAuthSession('old-refresh-token')).rejects.toMatchObject({
      message: 'User no longer exists',
      statusCode: 401,
    });

    expect(session.revokedAt).toBeInstanceOf(Date);
    expect(authSessionRepository.save).toHaveBeenCalledWith(session);
    expect(authSessionRepository.create).not.toHaveBeenCalled();
  });

  test('revokes sessions by refresh token and user id', async () => {
    await revokeAuthSession('refresh-token');
    await revokeUserSessions(user.id);

    expect(hashToken).toHaveBeenCalledWith('refresh-token');
    expect(authSessionRepository.revokeByRefreshTokenHash).toHaveBeenCalledWith(
      'hash:refresh-token',
    );
    expect(authSessionRepository.revokeActiveByUserId).toHaveBeenCalledWith(
      user.id,
    );
  });
});
