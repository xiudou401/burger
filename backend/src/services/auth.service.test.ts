import { ServiceError } from '../errors/ServiceError';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { pbkdf2Sync } from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { createAuthSession, revokeUserSessions } from './auth-session.service';
import { sendVerificationEmail } from './email.service';
import { hashPassword } from '../utils/password';
import {
  adminLogin,
  login,
  loginWithOAuth,
  resetPassword,
  signup,
  verifyEmail,
} from './auth.service';
import { getPermissionsForRole } from '../types/permissions';

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    existsByEmail: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByValidEmailVerificationToken: jest.fn(),
    findByValidPasswordResetToken: jest.fn(),
    consumeEmailVerificationToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
    consumeSmsCode: jest.fn(),
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
    permissions: getPermissionsForRole('customer'),
    status: 'active' as const,
    emailVerified: false,
    phone: undefined,
    phoneVerified: false,
  };
  const userDoc = {
    _id: userId,
    email: publicUser.email,
    name: publicUser.name,
    role: publicUser.role,
    status: publicUser.status,
    emailVerified: publicUser.emailVerified,
    phone: publicUser.phone,
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

  test('logs in admins only after confirming admin access', async () => {
    const passwordHash = await hashPassword('Burger#2026');
    const adminUser = {
      ...userDoc,
      role: 'admin' as const,
      permissions: getPermissionsForRole('admin'),
      passwordHash,
    };
    const publicAdmin = {
      ...publicUser,
      role: 'admin' as const,
      permissions: getPermissionsForRole('admin'),
    };

    jest
      .mocked(userRepository.findByEmailWithPassword)
      .mockResolvedValue(adminUser as never);
    jest.mocked(createAuthSession).mockResolvedValue({
      accessToken: 'admin-access-token',
      refreshToken: 'admin-refresh-token',
      user: publicAdmin,
    });

    const result = await adminLogin({
      email: 'pat@example.com',
      password: 'Burger#2026',
    });

    expect(createAuthSession).toHaveBeenCalledWith(publicAdmin);
    expect(result.refreshToken).toBe('admin-refresh-token');
  });

  test('rejects customer admin login without creating a session', async () => {
    const passwordHash = await hashPassword('Burger#2026');
    jest.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
      ...userDoc,
      passwordHash,
    } as never);

    await expect(
      adminLogin({
        email: 'pat@example.com',
        password: 'Burger#2026',
      }),
    ).rejects.toMatchObject({
      message: 'Admin access required',
      statusCode: 403,
    });

    expect(createAuthSession).not.toHaveBeenCalled();
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
      emailVerified: true,
    };
    jest
      .mocked(userRepository.consumeEmailVerificationToken)
      .mockResolvedValue(verificationUser as never);

    const result = await verifyEmail({ token: 'verification-token' });

    expect(userRepository.consumeEmailVerificationToken).toHaveBeenCalledWith(
      expect.any(String),
    );
    expect(userRepository.save).not.toHaveBeenCalled();
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
      status: 'active' as const,
    };
    jest
      .mocked(userRepository.consumePasswordResetToken)
      .mockResolvedValue(resetUser as never);

    const result = await resetPassword({
      token: 'reset-token',
      password: 'Burger#2027',
    });

    expect(userRepository.consumePasswordResetToken).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('210000:'),
    );
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(revokeUserSessions).toHaveBeenCalledWith(userId);
    expect(result.message).toBe('Password reset successfully');
  });

  test('rejects OAuth users when the provider email is not verified', async () => {
    await expect(
      loginWithOAuth({
        email: 'pat@example.com',
        name: 'Pat',
        emailVerified: false,
      }),
    ).rejects.toMatchObject({
      message: 'OAuth email must be verified',
      statusCode: 400,
    });

    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(createAuthSession).not.toHaveBeenCalled();
  });

  test('rejects admin OAuth for customer accounts without creating a session', async () => {
    jest.mocked(userRepository.findByEmail).mockResolvedValue(userDoc as never);

    await expect(
      loginWithOAuth({
        email: 'pat@example.com',
        name: 'Pat',
        emailVerified: true,
        mode: 'admin',
      }),
    ).rejects.toMatchObject({
      message: 'Admin access required',
      statusCode: 403,
    });

    expect(createAuthSession).not.toHaveBeenCalled();
  });

  test('does not create customer accounts from admin OAuth login', async () => {
    jest.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      loginWithOAuth({
        email: 'new@example.com',
        name: 'New Staff',
        emailVerified: true,
        mode: 'admin',
      }),
    ).rejects.toMatchObject({
      message: 'Admin access required',
      statusCode: 403,
    });

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(createAuthSession).not.toHaveBeenCalled();
  });
});
