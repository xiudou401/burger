import { createContext } from 'use-context-selector';
import type { User } from '../../types/auth';

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;

  login: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;

  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
