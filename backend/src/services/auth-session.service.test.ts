import { ServiceError } from '../errors/ServiceError';
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
    findByRefreshTokenHash: jest.fn(),
    revokeByRefreshTokenHash: jest.fn(),
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
    const result = await createAuthSession(user);

    expect(authSessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
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
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: undefined as Date | undefined,
      rotatedAt: undefined as Date | undefined,
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
      .mocked(authSessionRepository.findByRefreshTokenHash)
      .mockResolvedValue(session as never);
    jest.mocked(userRepository.findById).mockResolvedValue(userDoc as never);

    const result = await rotateAuthSession('old-refresh-token');

    expect(authSessionRepository.findByRefreshTokenHash).toHaveBeenCalledWith(
      'hash:old-refresh-token',
    );
    expect(session.revokedAt).toBeInstanceOf(Date);
    expect(session.rotatedAt).toBeInstanceOf(Date);
    expect(authSessionRepository.save).toHaveBeenCalledWith(session);
    expect(authSessionRepository.create).toHaveBeenCalled();
    expect(result.user.id).toBe(user.id);
  });

  test('rejects missing or expired refresh sessions', async () => {
    await expect(rotateAuthSession('')).rejects.toThrow(ServiceError);

    jest
      .mocked(authSessionRepository.findByRefreshTokenHash)
      .mockResolvedValue({
        expiresAt: new Date(Date.now() - 1),
      } as never);

    await expect(rotateAuthSession('expired-token')).rejects.toThrow(
      ServiceError,
    );
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
