export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
