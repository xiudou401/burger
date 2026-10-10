import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { AuthProvider } from './auth-provider';
import { useAuth } from './hooks/useAuth';
import { logout, restoreAuthSession } from '../../api/auth';
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

vi.mock('use-context-selector', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    createContext: React.createContext,
    useContextSelector: <TContext, TResult>(
      context: React.Context<TContext>,
      selector: (value: TContext) => TResult,
    ) => selector(React.useContext(context)),
  };
});

vi.mock('../../api/auth', () => ({
  restoreAuthSession: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../api/auth-token', () => ({
  clearAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock('./auth-channel', () => ({
  broadcastAuthLogout: vi.fn(),
  createAuthChannel: vi.fn(),
}));

const customerUser = {
  id: 'user-1',
  name: 'Pat',
  email: 'pat@example.com',
  role: 'customer' as const,
  emailVerified: true,
};

const adminUser = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin' as const,
  emailVerified: true,
};

const AuthState = () => {
  const user = useAuth((ctx) => ctx.user);
  const accessToken = useAuth((ctx) => ctx.accessToken);
  const isAuthenticated = useAuth((ctx) => ctx.isAuthenticated);
  const isAuthLoading = useAuth((ctx) => ctx.isAuthLoading);
  const revalidateSession = useAuth((ctx) => ctx.revalidateSession);

  return (
    <div>
      <span data-testid="loading">{String(isAuthLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="token">{accessToken ?? 'none'}</span>
      <span data-testid="user">{user?.email ?? 'guest'}</span>
      <span data-testid="permissions">
        {(user?.permissions ?? []).join(',') || 'none'}
      </span>
      <button type="button" onClick={() => void revalidateSession()}>
        Revalidate session
      </button>
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
    close: vi.fn(),
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authChannel.close.mockClear();
    authChannel.postMessage.mockClear();
    authChannel.onmessage = null;
    vi.mocked(createAuthChannel).mockReturnValue(authChannel as never);
    vi.mocked(logout).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('restores an authenticated session on startup', async () => {
    vi.mocked(restoreAuthSession).mockResolvedValue({
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
    vi.mocked(restoreAuthSession).mockRejectedValue(
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

  test('stops auth loading if startup refresh does not settle', () => {
    vi.useFakeTimers();
    vi.mocked(restoreAuthSession).mockReturnValue(
      new Promise(() => undefined) as never,
    );

    renderAuthProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(clearAccessToken).toHaveBeenCalled();
  });

  test('clears auth state when the request layer reports session expiry', async () => {
    vi.mocked(restoreAuthSession).mockResolvedValue({
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
    vi.mocked(restoreAuthSession).mockRejectedValue(
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

  test('revalidates the current session on demand', async () => {
    vi.mocked(restoreAuthSession)
      .mockResolvedValueOnce({
        accessToken: 'restored-access-token',
        user: customerUser,
      })
      .mockResolvedValueOnce({
        accessToken: 'revalidated-access-token',
        user: adminUser,
      });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('pat@example.com');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Revalidate session' }));

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent(
        'revalidated-access-token',
      );
    });

    expect(screen.getByTestId('user')).toHaveTextContent('admin@example.com');
    expect(screen.getByTestId('permissions')).toHaveTextContent('manage_menu');
    expect(restoreAuthSession).toHaveBeenCalledTimes(2);
  });

  test('logs out when another tab broadcasts logout', async () => {
    vi.mocked(restoreAuthSession).mockResolvedValue({
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
