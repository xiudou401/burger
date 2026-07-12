import { act, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './auth-provider';
import { useAuth } from './hooks/useAuth';
import { logout, refreshSession } from '../../api/auth';
import {
  notifyAuthSessionExpired,
  notifyAuthSessionRefreshed,
} from '../../api/auth-events';
import { ApiError } from '../../api/request';
import {
  clearAccessToken,
  setAccessToken as setApiAccessToken,
} from '../../api/auth-token';
import { createAuthChannel } from './auth-channel';

jest.mock('use-context-selector', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    createContext: React.createContext,
    useContextSelector: <TContext, TResult>(
      context: React.Context<TContext>,
      selector: (value: TContext) => TResult,
    ) => selector(React.useContext(context)),
  };
});

jest.mock('../../api/auth', () => ({
  refreshSession: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../api/auth-token', () => ({
  clearAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
}));

jest.mock('./auth-channel', () => ({
  broadcastAuthLogout: jest.fn(),
  createAuthChannel: jest.fn(),
}));

const customerUser = {
  id: 'user-1',
  name: 'Pat',
  email: 'pat@example.com',
  role: 'customer' as const,
  emailVerified: true,
  phoneVerified: false,
};

const adminUser = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin' as const,
  emailVerified: true,
  phoneVerified: false,
};

const AuthState = () => {
  const user = useAuth((ctx) => ctx.user);
  const accessToken = useAuth((ctx) => ctx.accessToken);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);

  return (
    <div>
      <span data-testid="loading">{String(isAuthLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="token">{accessToken ?? 'none'}</span>
      <span data-testid="user">{user?.email ?? 'guest'}</span>
      <span data-testid="permissions">
        {(user?.permissions ?? []).join(',') || 'none'}
      </span>
    </div>
  );
};

const renderAuthProvider = () => {
  return render(
    <AuthProvider>
      <AuthState />
    </AuthProvider>,
  );
};

describe('AuthProvider lifecycle', () => {
  const authChannel = {
    close: jest.fn(),
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authChannel.close.mockClear();
    authChannel.postMessage.mockClear();
    authChannel.onmessage = null;
    jest.mocked(createAuthChannel).mockReturnValue(authChannel as never);
    jest.mocked(logout).mockResolvedValue(undefined);
  });

  test('restores an authenticated session on startup', async () => {
    jest.mocked(refreshSession).mockResolvedValue({
      accessToken: 'restored-access-token',
      user: customerUser,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent(
      'restored-access-token',
    );
    expect(screen.getByTestId('user')).toHaveTextContent('pat@example.com');
    expect(screen.getByTestId('permissions')).toHaveTextContent(
      'create_order,view_own_orders',
    );
    expect(setApiAccessToken).toHaveBeenCalledWith('restored-access-token');
  });

  test('keeps the user logged out when startup refresh is unauthorized', async () => {
    jest.mocked(refreshSession).mockRejectedValue(
      new ApiError(401, {
        message: 'Session expired',
      }),
    );

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('guest');
    expect(clearAccessToken).toHaveBeenCalled();
  });

  test('clears auth state when the request layer reports session expiry', async () => {
    jest.mocked(refreshSession).mockResolvedValue({
      accessToken: 'restored-access-token',
      user: customerUser,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    act(() => {
      notifyAuthSessionExpired();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('guest');
    expect(clearAccessToken).toHaveBeenCalled();
  });

  test('updates auth state when the request layer refreshes the session', async () => {
    jest.mocked(refreshSession).mockRejectedValue(
      new ApiError(401, {
        message: 'Session expired',
      }),
    );

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    act(() => {
      notifyAuthSessionRefreshed({
        accessToken: 'fresh-access-token',
        user: adminUser,
      });
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent('fresh-access-token');
    expect(screen.getByTestId('user')).toHaveTextContent('admin@example.com');
    expect(screen.getByTestId('permissions')).toHaveTextContent('manage_menu');
    expect(setApiAccessToken).toHaveBeenCalledWith('fresh-access-token');
  });

  test('logs out when another tab broadcasts logout', async () => {
    jest.mocked(refreshSession).mockResolvedValue({
      accessToken: 'restored-access-token',
      user: customerUser,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    act(() => {
      authChannel.onmessage?.({
        data: { type: 'logout' },
      } as MessageEvent);
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('guest');
    expect(clearAccessToken).toHaveBeenCalled();
  });
});
