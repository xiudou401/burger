import { UserModel } from '../models/user.model';
import { ServiceError } from '../errors/ServiceError';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/token';
import type { AuthenticatedUser } from '../types/auth';

interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
}

const toPublicUser = (user: {
  _id: unknown;
  email: string;
  name: string;
}): AuthenticatedUser => {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
  };
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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
  const publicUser = toPublicUser(user);

  return {
    accessToken: signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
    }),
    user: publicUser,
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
