import { UserModel } from '../models/user.model';
import { ServiceError } from '../errors/ServiceError';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/token';
import type { AuthenticatedUser } from '../types/auth';
import { createSecureToken, hashToken } from '../utils/secure-token';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './email.service';
import { env } from '../config/env';

interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
  emailVerificationToken?: string;
}

interface MessageResult {
  message: string;
  resetToken?: string;
  emailVerificationToken?: string;
}

const toPublicUser = (user: {
  _id: unknown;
  email: string;
  name: string;
  emailVerified: boolean;
}): AuthenticatedUser => {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
  };
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isDevEmailMode = () => !env.RESEND_API_KEY || !env.EMAIL_FROM;

const assertCredentials = (email: string, password: string) => {
  if (!email || !email.includes('@')) {
    throw new ServiceError('Invalid email', 400);
  }

  if (!password || password.length < 6) {
    throw new ServiceError('Password must be at least 6 characters', 400);
  }
};

export const signup = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> => {
  const normalizedName = name?.trim();
  const normalizedEmail = normalizeEmail(email ?? '');

  if (!normalizedName) {
    throw new ServiceError('Name is required', 400);
  }

  assertCredentials(normalizedEmail, password);

  const existingUser = await UserModel.exists({ email: normalizedEmail });

  if (existingUser) {
    throw new ServiceError('Email already registered', 409);
  }

  const user = await UserModel.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  });
  const emailVerificationToken = await createEmailVerificationToken(
    String(user._id),
    normalizedEmail,
  );
  const publicUser = toPublicUser(user);

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
    }),
    user: publicUser,
    ...(isDevEmailMode() ? { emailVerificationToken } : {}),
  };
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const normalizedEmail = normalizeEmail(email ?? '');

  assertCredentials(normalizedEmail, password);

  const user = await UserModel.findOne({ email: normalizedEmail })
    .select('+passwordHash')
    .exec();

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ServiceError('Invalid email or password', 401);
  }

  const publicUser = toPublicUser(user);

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
    }),
    user: publicUser,
  };
};

export const createEmailVerificationToken = async (
  userId: string,
  email: string,
) => {
  const token = createSecureToken();

  await UserModel.findByIdAndUpdate(userId, {
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  await sendVerificationEmail({ email, token });

  return token;
};

export const resendVerificationEmail = async (
  userId: string,
): Promise<MessageResult> => {
  const user = await UserModel.findById(userId).exec();

  if (!user) {
    throw new ServiceError('User not found', 404);
  }

  if (user.emailVerified) {
    return { message: 'Email already verified' };
  }

  const emailVerificationToken = await createEmailVerificationToken(
    String(user._id),
    user.email,
  );

  return {
    message: 'Verification email sent',
    ...(isDevEmailMode() ? { emailVerificationToken } : {}),
  };
};

export const verifyEmail = async (token: string): Promise<MessageResult> => {
  if (!token) {
    throw new ServiceError('Verification token is required', 400);
  }

  const user = await UserModel.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  })
    .select('+emailVerificationTokenHash +emailVerificationExpiresAt')
    .exec();

  if (!user) {
    throw new ServiceError('Verification link is invalid or expired', 400);
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  return { message: 'Email verified' };
};

export const requestPasswordReset = async (
  email: string,
): Promise<MessageResult> => {
  const normalizedEmail = normalizeEmail(email ?? '');

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new ServiceError('Invalid email', 400);
  }

  const user = await UserModel.findOne({ email: normalizedEmail }).exec();

  if (!user) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  const resetToken = createSecureToken();
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  await sendPasswordResetEmail({ email: user.email, token: resetToken });

  return {
    message: 'If the email exists, a reset link has been sent',
    ...(isDevEmailMode() ? { resetToken } : {}),
  };
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<MessageResult> => {
  if (!token) {
    throw new ServiceError('Reset token is required', 400);
  }

  if (!password || password.length < 6) {
    throw new ServiceError('Password must be at least 6 characters', 400);
  }

  const user = await UserModel.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  })
    .select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt')
    .exec();

  if (!user) {
    throw new ServiceError('Reset link is invalid or expired', 400);
  }

  user.passwordHash = hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return { message: 'Password reset successfully' };
};

export const loginWithOAuth = async ({
  email,
  name,
  emailVerified,
}: {
  email: string;
  name: string;
  emailVerified: boolean;
}): Promise<AuthResult> => {
  const normalizedEmail = normalizeEmail(email ?? '');
  const normalizedName = name?.trim() || normalizedEmail.split('@')[0];

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new ServiceError('OAuth provider did not return a valid email', 400);
  }

  let user = await UserModel.findOne({ email: normalizedEmail }).exec();
  let isNewUser = false;

  if (!user) {
    user = await UserModel.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashPassword(createSecureToken()),
      emailVerified,
    });
    isNewUser = true;
  } else {
    user.name = user.name || normalizedName;
    user.emailVerified = user.emailVerified || emailVerified;
    await user.save();
  }

  const publicUser = toPublicUser(user);

  if (isNewUser) {
    await sendWelcomeEmail({
      email: publicUser.email,
      name: publicUser.name,
    });
  }

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
    }),
    user: publicUser,
  };
};
