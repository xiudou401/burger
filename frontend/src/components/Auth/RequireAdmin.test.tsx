import { render, screen } from '@testing-library/react';
import RequireAdmin from './RequireAdmin';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { AuthContextValue } from '../../store/auth/auth-context';
import type { User } from '../../types/auth';

jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
    Outlet: () => <div>Admin orders</div>,
    useLocation: () => ({ pathname: '/admin/orders' }),
  }),
  { virtual: true },
);

jest.mock('../../store/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const user = (role: User['role']): User => ({
  id: 'user-1',
  name: 'Pat',
  email: 'pat@example.com',
  role,
  emailVerified: true,
  phoneVerified: false,
});

const baseAuth: AuthContextValue = {
  user: null,
  accessToken: null,
  login: jest.fn(),
  updateUser: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  isAuthLoading: false,
};

const renderGuard = (auth: Partial<AuthContextValue>) => {
  const authValue = { ...baseAuth, ...auth };
  jest.mocked(useAuth).mockImplementation((selector) => selector(authValue));

  return render(<RequireAdmin />);
};

describe('RequireAdmin', () => {
  afterEach(() => {
    jest.clearAllMocks();
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

  test('redirects customers away from admin routes', () => {
    renderGuard({
      isAuthenticated: true,
      accessToken: 'access-token',
      user: user('customer'),
    });

    expect(
      screen.getByText('Navigate to /admin/login?error=Admin access required'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Admin orders')).not.toBeInTheDocument();
  });

  test.each(['admin', 'staff'] as const)(
    'allows %s users into admin routes',
    (role) => {
      renderGuard({
        isAuthenticated: true,
        accessToken: 'access-token',
        user: user(role),
      });

      expect(screen.getByText('Admin orders')).toBeInTheDocument();
    },
  );
});
