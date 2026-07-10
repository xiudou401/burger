import type { Permission, UserRole } from './permissions';

export interface User {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  permissions?: Permission[];
  status?: 'active' | 'disabled';
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  emailVerificationToken?: string;
  emailVerificationEmailFailed?: boolean;
}
