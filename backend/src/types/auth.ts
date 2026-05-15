export interface AuthenticatedUser {
  id: string;
  email?: string;
  name: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export interface AuthTokenPayload {
  sub: string;
  email?: string;
  phone?: string;
  iat: number;
  exp: number;
}
