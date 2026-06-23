import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { logout as logoutRequest, refreshSession } from '../../api/auth';
import {
  clearAccessToken,
  setAccessToken as setApiAccessToken,
} from '../../api/auth-token';
import { AuthContext } from './auth-context';
import type { User } from '../../types/auth';

interface Props {
  children: ReactNode;
}

const AUTH_CHANNEL_NAME = 'burger-auth';

interface AuthChannelMessage {
  type: 'logout';
}

const createAuthChannel = () => {
  if (
    typeof window === 'undefined' ||
    typeof window.BroadcastChannel === 'undefined'
  ) {
    return null;
  }

  return new BroadcastChannel(AUTH_CHANNEL_NAME);
};

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    clearAccessToken();
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const res = await refreshSession();

        if (!isMounted) return;

        setAccessToken(res.accessToken);
        setApiAccessToken(res.accessToken);
        setUser({
          ...res.user,
          role: res.user.role ?? 'customer',
        });
      } catch {
        if (!isMounted) return;

        clearAuthState();
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState]);

  useEffect(() => {
    const channel = createAuthChannel();

    if (!channel) return;

    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      if (event.data?.type === 'logout') {
        clearAuthState();
      }
    };

    return () => {
      channel.close();
    };
  }, [clearAuthState]);

  const login = useCallback((token: string, user: User) => {
    setAccessToken(token);
    setApiAccessToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuthState();

      const channel = createAuthChannel();
      channel?.postMessage({ type: 'logout' } satisfies AuthChannelMessage);
      channel?.close();
    }
  }, [clearAuthState]);

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
