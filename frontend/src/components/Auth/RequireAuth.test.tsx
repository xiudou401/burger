import { render, screen } from '@testing-library/react';
import RequireAuth from './RequireAuth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { AuthContextValue } from '../../store/auth/auth-context';

let mockLocation = { pathname: '/profile', search: '' };

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  Outlet: () => <div>Private profile</div>,
  useLocation: () => mockLocation,
}));

vi.mock('../../store/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const baseAuth: AuthContextValue = {
  user: null,
  accessToken: null,
  login: vi.fn(),
  updateUser: vi.fn(),
  revalidateSession: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: false,
  isAuthLoading: false,
};

const renderGuard = (auth: Partial<AuthContextValue>) => {
  const authValue = { ...baseAuth, ...auth };
  vi.mocked(useAuth).mockImplementation((selector) => selector(authValue));

  return render(<RequireAuth />);
};

describe('RequireAuth', () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockLocation = { pathname: '/profile', search: '' };
  });

  test('shows a loading fallback while auth state is loading', () => {
    renderGuard({ isAuthLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Restoring your session...',
    );
  });

  test('redirects anonymous users to login', () => {
    renderGuard({ isAuthenticated: false });

    expect(screen.getByText('Navigate to /login')).toBeInTheDocument();
    expect(screen.queryByText('Private profile')).not.toBeInTheDocument();
  });

  test('redirects anonymous payment returns to the public return route', () => {
    mockLocation = {
      pathname: '/profile',
      search: '?payment=success&orderId=order-123',
    };

    renderGuard({ isAuthenticated: false });

    expect(
      screen.getByText(
        'Navigate to /payment/return?payment=success&orderId=order-123',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Private profile')).not.toBeInTheDocument();
  });

  test('renders protected content for authenticated users', () => {
    renderGuard({
      isAuthenticated: true,
      accessToken: 'access-token',
    });

    expect(screen.getByText('Private profile')).toBeInTheDocument();
  });
});
