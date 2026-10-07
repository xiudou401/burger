import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { logout as logoutRequest, restoreAuthSession } from '../../api/auth';
import {
  clearAccessToken,
  setAccessToken as setApiAccessToken,
} from '../../api/auth-token';
import { ApiError } from '../../api/request';
import { HTTP_STATUS } from '../../api/http-status';
import {
  subscribeToAuthSessionExpired,
  subscribeToAuthSessionRefreshed,
} from '../../api/auth-events';
import { AuthContext } from './auth-context';
import {
  broadcastAuthLogout,
  createAuthChannel,
  type AuthChannelMessage,
} from './auth-channel';
import type { User } from '../../types/auth';
import { getPermissionsForRole } from '../../types/permissions';
import { reportError } from '../../utils/error-monitoring';

interface Props {
  children: ReactNode;
}

const AUTH_RESTORE_TIMEOUT_MS = 12_000;

const normalizeUser = (user: User): User => ({
  ...user,
  role: user.role ?? 'customer',
  permissions:
    user.permissions ?? getPermissionsForRole(user.role ?? 'customer'),
});

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    clearAccessToken();
    setAccessToken(null);
    setUser(null);
  }, []);

  const applyAuthSession = useCallback((token: string, user: User) => {
    const normalizedUser = normalizeUser(user);

    setApiAccessToken(token);
    setAccessToken(token);
    setUser(normalizedUser);

    return normalizedUser;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let isRestoreActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!isMounted || !isRestoreActive) {
        return;
      }

      isRestoreActive = false;
      clearAuthState();
      setIsAuthLoading(false);
    }, AUTH_RESTORE_TIMEOUT_MS);

    const restoreSession = async () => {
      try {
        const res = await restoreAuthSession();

        if (!isMounted || !isRestoreActive) return;

        window.clearTimeout(timeoutId);

        applyAuthSession(res.accessToken, res.user);
      } catch (error) {
        if (
          process.env.NODE_ENV === 'development' &&
          !(
            error instanceof ApiError &&
            error.statusCode === HTTP_STATUS.UNAUTHORIZED
          )
        ) {
          reportError(error, {
            source: 'auth',
            operation: 'restore-session',
          });
        }

        if (!isMounted || !isRestoreActive) return;

        window.clearTimeout(timeoutId);

        clearAuthState();
      } finally {
        if (isMounted && isRestoreActive) {
          isRestoreActive = false;
          window.clearTimeout(timeoutId);
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
      isRestoreActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [applyAuthSession, clearAuthState]);

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

  useEffect(() => {
    return subscribeToAuthSessionExpired(clearAuthState);
  }, [clearAuthState]);

  useEffect(() => {
    return subscribeToAuthSessionRefreshed(({ accessToken, user }) => {
      applyAuthSession(accessToken, user);
    });
  }, [applyAuthSession]);

  const login = useCallback((token: string, user: User) => {
    applyAuthSession(token, user);
  }, [applyAuthSession]);

  const updateUser = useCallback((user: User) => {
    setUser(normalizeUser(user));
  }, []);

  const revalidateSession = useCallback(async () => {
    try {
      const res = await restoreAuthSession();

      return applyAuthSession(res.accessToken, res.user);
    } catch (error) {
      clearAuthState();
      throw error;
    }
  }, [applyAuthSession, clearAuthState]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        reportError(error, {
          source: 'auth',
          operation: 'logout',
        });
      }
    } finally {
      clearAuthState();
      broadcastAuthLogout();
    }
  }, [clearAuthState]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      updateUser,
      revalidateSession,
      logout,
      isAuthenticated: !!accessToken && !!user,
      isAuthLoading,
    }),
    [
      user,
      accessToken,
      login,
      updateUser,
      revalidateSession,
      logout,
      isAuthLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
