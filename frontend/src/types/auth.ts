export interface User {
  id: string;
  email?: string;
  name: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  emailVerificationToken?: string;
}
