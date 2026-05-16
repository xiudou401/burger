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
import {
  createSmsCode,
  isDevSmsMode,
  sendSmsVerificationCode,
  SMS_CODE_TTL_MS,
} from './sms.service';
import { env } from '../config/env';
import {
  PASSWORD_POLICY_MESSAGE,
  validatePasswordPolicy,
} from '../utils/password-policy';

interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
  emailVerificationToken?: string;
}

interface MessageResult {
  message: string;
  resetToken?: string;
  emailVerificationToken?: string;
  devSmsCode?: string;
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

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizePhone = (phone: string) => phone.trim().replace(/[()\s-]/g, '');
const isDevEmailMode = () => !env.RESEND_API_KEY || !env.EMAIL_FROM;

const assertEmail = (email: string) => {
  if (!email || !email.includes('@')) {
    throw new ServiceError('Invalid email', 400);
  }
};

const assertPhone = (phone: string) => {
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new ServiceError('Phone must use E.164 format, for example +61412345678', 400);
  }
};

const assertPasswordPresent = (password: string) => {
  if (!password) {
    throw new ServiceError('Password is required', 400);
  }
};

const assertNewPassword = (password: string) => {
  assertPasswordPresent(password);

  if (!validatePasswordPolicy(password)) {
    throw new ServiceError(PASSWORD_POLICY_MESSAGE, 400);
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

  assertEmail(normalizedEmail);
  assertNewPassword(password);

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
      phone: publicUser.phone,
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

  assertEmail(normalizedEmail);
  assertPasswordPresent(password);

  const user = await UserModel.findOne({ email: normalizedEmail })
    .select('+passwordHash')
    .exec();

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw new ServiceError('Invalid email or password', 401);
  }

  const publicUser = toPublicUser(user);

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
      phone: publicUser.phone,
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

  if (!user.email) {
    throw new ServiceError('Email is not linked to this account', 400);
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

  if (!user.email) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

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

  assertNewPassword(password);

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

export const sendSmsCode = async (
  phone: string,
  userId?: string,
): Promise<MessageResult> => {
  const normalizedPhone = normalizePhone(phone ?? '');
  assertPhone(normalizedPhone);

  const existingUser = await UserModel.findOne({ phone: normalizedPhone }).exec();

  if (userId && existingUser && String(existingUser._id) !== userId) {
    throw new ServiceError('Phone is already linked to another account', 409);
  }

  let user = existingUser;

  if (userId && !user) {
    user = await UserModel.findById(userId).exec();

    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    user.phone = normalizedPhone;
    user.phoneVerified = false;
  }

  if (!user) {
    user = await UserModel.create({
      name: `Burger fan ${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      phoneVerified: false,
    });
  }

  const code = createSmsCode();
  user.smsVerificationCodeHash = hashToken(code);
  user.smsVerificationExpiresAt = new Date(Date.now() + SMS_CODE_TTL_MS);
  await user.save();

  await sendSmsVerificationCode({
    phone: normalizedPhone,
    code,
  });

  return {
    message: 'SMS verification code sent',
    ...(isDevSmsMode() ? { devSmsCode: code } : {}),
  };
};

export const verifySmsCode = async (
  phone: string,
  code: string,
): Promise<AuthResult> => {
  const normalizedPhone = normalizePhone(phone ?? '');
  assertPhone(normalizedPhone);

  if (!code || !/^\d{6}$/.test(code)) {
    throw new ServiceError('SMS code must be 6 digits', 400);
  }

  const user = await UserModel.findOne({
    phone: normalizedPhone,
    smsVerificationCodeHash: hashToken(code),
    smsVerificationExpiresAt: { $gt: new Date() },
  })
    .select('+smsVerificationCodeHash +smsVerificationExpiresAt')
    .exec();

  if (!user) {
    throw new ServiceError('SMS code is invalid or expired', 400);
  }

  user.phoneVerified = true;
  user.smsVerificationCodeHash = undefined;
  user.smsVerificationExpiresAt = undefined;
  await user.save();

  const publicUser = toPublicUser(user);

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
      phone: publicUser.phone,
    }),
    user: publicUser,
  };
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
    if (mode === 'signup') {
      throw new ServiceError('Email already registered. Please log in instead.', 409);
    }

    user.name = user.name || normalizedName;
    user.emailVerified = user.emailVerified || emailVerified;
    await user.save();
  }

  const publicUser = toPublicUser(user);

  if (isNewUser) {
    await sendWelcomeEmail({
      email: publicUser.email!,
      name: publicUser.name,
    });
  }

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
      phone: publicUser.phone,
    }),
    user: publicUser,
  };
};
