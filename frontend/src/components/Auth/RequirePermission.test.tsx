import { render, screen } from '@testing-library/react';
import RequirePermission from './RequirePermission';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { AuthContextValue } from '../../store/auth/auth-context';
import type { User } from '../../types/auth';

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  Outlet: () => <div>Admin orders</div>,
  useLocation: () => ({ pathname: '/admin/orders' }),
}));

vi.mock('../../store/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const user = (role: User['role']): User => ({
  id: 'user-1',
  name: 'Pat',
  email: 'pat@example.com',
  role,
  emailVerified: true,
});

const baseAuth: AuthContextValue = {
  user: null,
  accessToken: null,
  login: vi.fn(),
  updateUser: vi.fn(),
  revalidateSession: async () => user('admin'),
  logout: vi.fn(),
  isAuthenticated: false,
  isAuthLoading: false,
};

const renderGuard = (
  auth: Partial<AuthContextValue>,
  permission: 'view_orders' | 'manage_menu' = 'view_orders',
) => {
  const authValue = { ...baseAuth, ...auth };
  vi.mocked(useAuth).mockImplementation((selector) => selector(authValue));

  return render(<RequirePermission permission={permission} />);
};

describe('RequirePermission', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('shows a loading fallback while auth state is loading', () => {
    renderGuard({ isAuthLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Restoring your session...',
    );
  });

  test('redirects anonymous users to admin login', () => {
    renderGuard({ isAuthenticated: false });

    expect(screen.getByText('Navigate to /admin/login')).toBeInTheDocument();
  });

  test('redirects staff without menu permission to orders', async () => {
    renderGuard({ isAuthenticated: true, user: user('staff') }, 'manage_menu');
    expect(
      await screen.findByText('Navigate to /admin/orders'),
    ).toBeInTheDocument();
  });

  test('allows admins to manage the menu', async () => {
    renderGuard({ isAuthenticated: true, user: user('admin') }, 'manage_menu');
    expect(await screen.findByText('Admin orders')).toBeInTheDocument();
  });

  test('redirects customers away from admin routes', async () => {
    renderGuard({
      isAuthenticated: true,
      accessToken: 'access-token',
      user: user('customer'),
    });

    expect(
      await screen.findByText(
        'Navigate to /admin/login?error=Admin access required',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Admin orders')).not.toBeInTheDocument();
  });

  test.each(['admin', 'staff'] as const)(
    'allows %s users into admin routes',
    async (role) => {
      renderGuard({
        isAuthenticated: true,
        accessToken: 'access-token',
        user: user(role),
      });

      expect(await screen.findByText('Admin orders')).toBeInTheDocument();
    },
  );

  test('revalidates active admin users before rendering admin routes', async () => {
    const revalidateSession = vi.fn().mockResolvedValue(user('admin'));

    renderGuard({
      isAuthenticated: true,
      accessToken: 'access-token',
      user: user('admin'),
      revalidateSession,
    });

    expect(await screen.findByText('Admin orders')).toBeInTheDocument();
    expect(revalidateSession).toHaveBeenCalledTimes(1);
  });

  test('redirects to admin login when active admin revalidation fails', async () => {
    const revalidateSession = vi
      .fn()
      .mockRejectedValue(new Error('Account disabled'));

    renderGuard({
      isAuthenticated: true,
      accessToken: 'access-token',
      user: user('admin'),
      revalidateSession,
    });

    expect(
      await screen.findByText('Navigate to /admin/login'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Admin orders')).not.toBeInTheDocument();
  });
});
