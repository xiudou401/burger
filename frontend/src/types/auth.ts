export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  emailVerificationToken?: string;
}
