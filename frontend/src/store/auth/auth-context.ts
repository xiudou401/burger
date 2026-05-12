import { createContext } from 'use-context-selector';
import type { User } from '../../types/auth';

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;

  login: (token: string, user: User) => void;
  logout: () => void;

  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
