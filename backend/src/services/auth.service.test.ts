import { ServiceError } from '../errors/ServiceError';
import { Types } from 'mongoose';
import { userRepository } from '../repositories/user.repository';
import { createAuthSession, revokeUserSessions } from './auth-session.service';
import { sendVerificationEmail } from './email.service';
import { hashPassword } from '../utils/password';
import { login, resetPassword, signup } from './auth.service';

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    existsByEmail: jest.fn(),
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
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

    const result = await signup(' Pat ', 'PAT@example.com', 'Burger#2026');

    expect(userRepository.existsByEmail).toHaveBeenCalledWith('pat@example.com');
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
  });

  test('rejects duplicate signup emails', async () => {
    jest
      .mocked(userRepository.existsByEmail)
      .mockResolvedValue({ _id: new Types.ObjectId() });

    await expect(
      signup('Pat', 'pat@example.com', 'Burger#2026'),
    ).rejects.toThrow(ServiceError);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  test('logs in users with valid credentials', async () => {
    const passwordHash = hashPassword('Burger#2026');
    jest.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
      ...userDoc,
      passwordHash,
    } as never);

    const result = await login('PAT@example.com', 'Burger#2026');

    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
      'pat@example.com',
    );
    expect(createAuthSession).toHaveBeenCalledWith(publicUser);
    expect(result.refreshToken).toBe('refresh-token');
  });

  test('rejects login with invalid credentials', async () => {
    jest.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
      ...userDoc,
      passwordHash: hashPassword('Burger#2026'),
    } as never);

    await expect(login('pat@example.com', 'wrong-password')).rejects.toThrow(
      ServiceError,
    );
    expect(createAuthSession).not.toHaveBeenCalled();
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

    const result = await resetPassword('reset-token', 'Burger#2027');

    expect(userRepository.save).toHaveBeenCalledWith(resetUser);
    expect(revokeUserSessions).toHaveBeenCalledWith(userId);
    expect(resetUser.passwordHash).not.toBe('old-hash');
    expect(resetUser.passwordResetTokenHash).toBeUndefined();
    expect(resetUser.passwordResetExpiresAt).toBeUndefined();
    expect(result.message).toBe('Password reset successfully');
  });
});
