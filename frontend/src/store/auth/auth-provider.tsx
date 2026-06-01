import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { logout as logoutRequest, refreshSession } from '../../api/auth';
import {
  clearAccessToken,
  setAccessToken as setApiAccessToken,
} from '../../api/request';
import { AuthContext } from './auth-context';
import type { User } from '../../types/auth';

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    refreshSession()
      .then((res) => {
        if (!isMounted) return;

        setAccessToken(res.accessToken);
        setApiAccessToken(res.accessToken);
        setUser({
          ...res.user,
          role: res.user.role ?? 'customer',
        });
      })
      .catch(() => {
        if (!isMounted) return;

        setAccessToken(null);
        setUser(null);
        clearAccessToken();
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((token: string, user: User) => {
    setAccessToken(token);
    setApiAccessToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAccessToken();
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
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
      isAuthLoading,
    }),
    [user, accessToken, login, logout, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
