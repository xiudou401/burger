import type { AuthenticatedUser } from '../types/auth';

export interface PublicUserSource {
  _id: unknown;
  email?: string;
  name: string;
  role?: AuthenticatedUser['role'];
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export const toPublicUser = (user: PublicUserSource): AuthenticatedUser => ({
  id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role ?? 'customer',
  emailVerified: user.emailVerified,
  phone: user.phone,
  phoneVerified: user.phoneVerified,
});
