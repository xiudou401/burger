export interface User {
  id: string;
  email?: string;
  name: string;
  role: 'customer' | 'admin' | 'staff';
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  emailVerificationToken?: string;
}
