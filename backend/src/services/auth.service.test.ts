import { ServiceError } from '../errors/ServiceError';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { pbkdf2Sync } from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { createAuthSession, revokeUserSessions } from './auth-session.service';
import { sendVerificationEmail } from './email.service';
import { hashPassword } from '../utils/password';
import { login, resetPassword, signup, verifyEmail } from './auth.service';

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    existsByEmail: jest.fn(),
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByValidEmailVerificationToken: jest.fn(),
    findByValidPasswordResetToken: jest.fn(),
    save: jest.fn(),
    setEmailVerificationToken: jest.fn(),
  },
}));

jest.mock('./auth-session.service', () => ({
  createAuthSession: jest.fn(),
  revokeUserSessions: jest.fn(),
}));

jest.mock('./email.service', () => ({
  sendVerificationEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const makeLegacyHash = (password: string) => {
  const iterations = 120_000;
  const salt = 'legacy-salt';
  const hash = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString(
    'hex',
  );

  return `${iterations}:${salt}:${hash}`;
};

describe('auth service', () => {
  const userId = 'user-123';
  const publicUser = {
    id: userId,
    email: 'pat@example.com',
    name: 'Pat',
    role: 'customer' as const,
    emailVerified: false,
    phoneVerified: false,
  };
  const userDoc = {
    _id: userId,
    email: publicUser.email,
    name: publicUser.name,
    role: publicUser.role,
    emailVerified: publicUser.emailVerified,
    phoneVerified: publicUser.phoneVerified,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createAuthSession).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: publicUser,
    });
  });

  test('signs up new users, sends verification email, and creates a session', async () => {
    jest.mocked(userRepository.existsByEmail).mockResolvedValue(null);
    jest.mocked(userRepository.create).mockResolvedValue(userDoc as never);

    const result = await signup({
      name: 'Pat',
      email: 'pat@example.com',
      password: 'Burger#2026',
    });

    expect(userRepository.existsByEmail).toHaveBeenCalledWith(
      'pat@example.com',
    );
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Pat',
        email: 'pat@example.com',
        passwordHash: expect.any(String),
      }),
    );
    expect(userRepository.setEmailVerificationToken).toHaveBeenCalledWith(
      userId,
      expect.any(String),
      expect.any(Date),
    );
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'pat@example.com',
        token: expect.any(String),
      }),
    );
    expect(createAuthSession).toHaveBeenCalledWith(publicUser);
    expect(result.accessToken).toBe('access-token');
    expect(result.emailVerificationEmailFailed).toBeUndefined();
  });

  test('keeps signup successful when verification email delivery fails', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.mocked(userRepository.existsByEmail).mockResolvedValue(null);
    jest.mocked(userRepository.create).mockResolvedValue(userDoc as never);
    jest
      .mocked(sendVerificationEmail)
      .mockRejectedValue(new Error('Email provider unavailable'));

    const result = await signup({
      name: 'Pat',
      email: 'pat@example.com',
      password: 'Burger#2026',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'pat@example.com',
      }),
    );
    expect(userRepository.setEmailVerificationToken).toHaveBeenCalledWith(
      userId,
      expect.any(String),
      expect.any(Date),
    );
    expect(createAuthSession).toHaveBeenCalledWith(publicUser);
    expect(result.accessToken).toBe('access-token');
    expect(result.emailVerificationEmailFailed).toBe(true);

    consoleError.mockRestore();
  });

  test('rejects duplicate signup emails', async () => {
    jest
      .mocked(userRepository.existsByEmail)
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439011' } as never);

    await expect(
      signup({
        name: 'Pat',
        email: 'pat@example.com',
        password: 'Burger#2026',
      }),
    ).rejects.toMatchObject({
      message: 'Could not create account with these details',
      statusCode: 409,
    });
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  test('logs in users with valid credentials', async () => {
    const passwordHash = await hashPassword('Burger#2026');
    jest.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
      ...userDoc,
      passwordHash,
    } as never);

    const result = await login({
      email: 'pat@example.com',
      password: 'Burger#2026',
    });

    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
      'pat@example.com',
    );
    expect(createAuthSession).toHaveBeenCalledWith(publicUser);
    expect(result.refreshToken).toBe('refresh-token');
  });

  test('upgrades legacy password hashes after successful login', async () => {
    const loginUser = {
      ...userDoc,
      passwordHash: makeLegacyHash('Burger#2026'),
    };
    jest
      .mocked(userRepository.findByEmailWithPassword)
      .mockResolvedValue(loginUser as never);

    await login({
      email: 'pat@example.com',
      password: 'Burger#2026',
    });

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ _id: userId }),
    );
    expect(loginUser.passwordHash).not.toContain('120000:');
    expect(loginUser.passwordHash).toContain('210000:');
  });

  test('rejects login with invalid credentials', async () => {
    jest.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
      ...userDoc,
      passwordHash: await hashPassword('Burger#2026'),
    } as never);

    await expect(
      login({ email: 'pat@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(ServiceError);
    expect(createAuthSession).not.toHaveBeenCalled();
  });

  test('verifies email and returns the updated public user', async () => {
    const verificationUser = {
      ...userDoc,
      emailVerified: false,
      emailVerificationTokenHash: 'hash',
      emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    };
    jest
      .mocked(userRepository.findByValidEmailVerificationToken)
      .mockResolvedValue(verificationUser as never);

    const result = await verifyEmail({ token: 'verification-token' });

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ _id: userId }),
    );
    expect(verificationUser.emailVerified).toBe(true);
    expect(verificationUser.emailVerificationTokenHash).toBeUndefined();
    expect(verificationUser.emailVerificationExpiresAt).toBeUndefined();
    expect(result).toEqual({
      message: 'Email verified',
      user: {
        ...publicUser,
        emailVerified: true,
      },
    });
  });

  test('resets password and revokes existing sessions', async () => {
    const resetUser = {
      _id: userId,
      passwordHash: 'old-hash',
      passwordResetTokenHash: 'hash',
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    };
    jest
      .mocked(userRepository.findByValidPasswordResetToken)
      .mockResolvedValue(resetUser as never);

    const result = await resetPassword({
      token: 'reset-token',
      password: 'Burger#2027',
    });

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ _id: userId }),
    );
    expect(revokeUserSessions).toHaveBeenCalledWith(userId);
    expect(resetUser.passwordHash).not.toBe('old-hash');
    expect(resetUser.passwordResetTokenHash).toBeUndefined();
    expect(resetUser.passwordResetExpiresAt).toBeUndefined();
    expect(result.message).toBe('Password reset successfully');
  });
});
