import { ReactNode, useCallback, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import type { User } from '../../types/auth';

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken'),
  );

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as User;
    return {
      ...parsed,
      role: parsed.role ?? 'customer',
    };
  });

  const login = useCallback((token: string, user: User) => {
    setAccessToken(token);
    setUser(user);

    localStorage.setItem('accessToken', token);

    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);

    localStorage.removeItem('accessToken');

    localStorage.removeItem('user');
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      logout,
      isAuthenticated: !!accessToken,
    }),
    [user, accessToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
