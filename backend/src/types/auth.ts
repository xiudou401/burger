import type { Permission, UserRole } from './permissions';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status?: 'active' | 'disabled';
  emailVerified: boolean;
}

export interface AuthTokenPayload {
  sub: string;
  email?: string;
  iat: number;
  exp: number;
}
