import { ServiceError } from '../errors/ServiceError';
import { hashPassword, verifyPassword } from '../utils/password';
import type { AuthenticatedUser } from '../types/auth';
import { createSecureToken, hashToken } from '../utils/secure-token';
import { toPublicUser } from '../utils/public-user';
import { createAuthSession, revokeUserSessions } from './auth-session.service';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './email.service';
import {
  createSmsCode,
  isDevSmsMode,
  sendSmsVerificationCode,
} from './sms.service';
import { env } from '../config/env';
import { TTL_MS } from '../config/ttl';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SendSmsCodePayload,
  SignupPayload,
  VerifyEmailPayload,
  VerifySmsCodePayload,
} from '../validation/auth.schema';
import { userRepository } from '../repositories/user.repository';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
  emailVerificationToken?: string;
  emailVerificationEmailFailed?: boolean;
}

interface MessageResult {
  message: string;
  resetToken?: string;
  emailVerificationToken?: string;
  devSmsCode?: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isDevEmailMode = () => !env.RESEND_API_KEY || !env.EMAIL_FROM;

const createAuthResult = async (
  user: AuthenticatedUser,
  extra?: Omit<AuthResult, 'accessToken' | 'refreshToken' | 'user'>,
): Promise<AuthResult> => {
  const session = await createAuthSession(user);

  return {
    ...session,
    ...extra,
  };
};

const sendVerificationEmailSafely = async (email: string, token: string) => {
  try {
    await sendVerificationEmail({ email, token });
    return true;
  } catch (error) {
    console.error('Verification email send failed:', error);
    return false;
  }
};

export const signup = async ({
  name,
  email,
  password,
}: SignupPayload): Promise<AuthResult> => {
  const existingUser = await userRepository.existsByEmail(email);

  if (existingUser) {
    throw new ServiceError('Email already registered', 409);
  }

  const user = await userRepository.create({
    name,
    email,
    passwordHash: hashPassword(password),
  });
  const emailVerificationToken = await createEmailVerificationToken(
    String(user._id),
  );
  const emailSent = await sendVerificationEmailSafely(
    email,
    emailVerificationToken,
  );
  const publicUser = toPublicUser(user);

  return createAuthResult(publicUser, {
    ...(isDevEmailMode() ? { emailVerificationToken } : {}),
    ...(!emailSent ? { emailVerificationEmailFailed: true } : {}),
  });
};

export const login = async ({
  email,
  password,
}: LoginPayload): Promise<AuthResult> => {
  const user = await userRepository.findByEmailWithPassword(email);

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw new ServiceError('Invalid email or password', 401);
  }

  const publicUser = toPublicUser(user);

  return createAuthResult(publicUser);
};

export const createEmailVerificationToken = async (userId: string) => {
  const token = createSecureToken();

  await userRepository.setEmailVerificationToken(
    userId,
    hashToken(token),
    new Date(Date.now() + TTL_MS.EMAIL_VERIFICATION),
  );

  return token;
};

export const resendVerificationEmail = async (
  userId: string,
): Promise<MessageResult> => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ServiceError('User not found', 404);
  }

  if (user.emailVerified) {
    return { message: 'Email already verified' };
  }

  if (!user.email) {
    throw new ServiceError('Email is not linked to this account', 400);
  }

  const emailVerificationToken = await createEmailVerificationToken(
    String(user._id),
  );
  await sendVerificationEmail({
    email: user.email,
    token: emailVerificationToken,
  });

  return {
    message: 'Verification email sent',
    ...(isDevEmailMode() ? { emailVerificationToken } : {}),
  };
};

export const verifyEmail = async ({
  token,
}: VerifyEmailPayload): Promise<MessageResult> => {
  const user = await userRepository.findByValidEmailVerificationToken(
    hashToken(token),
  );

  if (!user) {
    throw new ServiceError('Verification link is invalid or expired', 400);
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await userRepository.save(user);

  return { message: 'Email verified' };
};

export const requestPasswordReset = async ({
  email,
}: ForgotPasswordPayload): Promise<MessageResult> => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  const resetToken = createSecureToken();
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + TTL_MS.PASSWORD_RESET);
  await userRepository.save(user);

  if (!user.email) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  await sendPasswordResetEmail({ email: user.email, token: resetToken });

  return {
    message: 'If the email exists, a reset link has been sent',
    ...(isDevEmailMode() ? { resetToken } : {}),
  };
};

export const resetPassword = async ({
  token,
  password,
}: ResetPasswordPayload): Promise<MessageResult> => {
  const user = await userRepository.findByValidPasswordResetToken(
    hashToken(token),
  );

  if (!user) {
    throw new ServiceError('Reset link is invalid or expired', 400);
  }

  user.passwordHash = hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await userRepository.save(user);
  await revokeUserSessions(String(user._id));

  return { message: 'Password reset successfully' };
};

export const sendSmsCode = async (
  { phone }: SendSmsCodePayload,
  userId?: string,
): Promise<MessageResult> => {
  const existingUser = await userRepository.findByPhone(phone);

  if (userId && existingUser && String(existingUser._id) !== userId) {
    throw new ServiceError('Phone is already linked to another account', 409);
  }

  let user = existingUser;

  if (userId && !user) {
    user = await userRepository.findById(userId);

    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    user.phone = phone;
    user.phoneVerified = false;
  }

  if (!user) {
    user = await userRepository.create({
      name: `Burger fan ${phone.slice(-4)}`,
      phone,
      phoneVerified: false,
    });
  }

  const code = createSmsCode();
  user.smsVerificationCodeHash = hashToken(code);
  user.smsVerificationExpiresAt = new Date(Date.now() + TTL_MS.SMS_CODE);
  await userRepository.save(user);

  await sendSmsVerificationCode({
    phone,
    code,
  });

  return {
    message: 'SMS verification code sent',
    ...(isDevSmsMode() ? { devSmsCode: code } : {}),
  };
};

export const verifySmsCode = async ({
  phone,
  code,
}: VerifySmsCodePayload): Promise<AuthResult> => {
  const user = await userRepository.findByValidSmsCode(phone, hashToken(code));

  if (!user) {
    throw new ServiceError('SMS code is invalid or expired', 400);
  }

  user.phoneVerified = true;
  user.smsVerificationCodeHash = undefined;
  user.smsVerificationExpiresAt = undefined;
  await userRepository.save(user);

  const publicUser = toPublicUser(user);

  return createAuthResult(publicUser);
};

export const loginWithOAuth = async ({
  email,
  name,
  emailVerified,
  mode = 'login',
}: {
  email: string;
  name: string;
  emailVerified: boolean;
  mode?: 'login' | 'signup';
}): Promise<AuthResult> => {
  const normalizedEmail = normalizeEmail(email ?? '');
  const normalizedName = name?.trim() || normalizedEmail.split('@')[0];

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new ServiceError('OAuth provider did not return a valid email', 400);
  }

  let user = await userRepository.findByEmail(normalizedEmail);
  let isNewUser = false;

  if (!user) {
    user = await userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashPassword(createSecureToken()),
      emailVerified,
    });
    isNewUser = true;
  } else {
    if (mode === 'signup') {
      throw new ServiceError(
        'Email already registered. Please log in instead.',
        409,
      );
    }

    user.name = user.name || normalizedName;
    user.emailVerified = user.emailVerified || emailVerified;
    await userRepository.save(user);
  }

  const publicUser = toPublicUser(user);

  if (isNewUser) {
    await sendWelcomeEmail({
      email: publicUser.email!,
      name: publicUser.name,
    });
  }

  return createAuthResult(publicUser);
};
