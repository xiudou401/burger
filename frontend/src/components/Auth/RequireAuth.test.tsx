import { render, screen } from '@testing-library/react';
import RequireAuth from './RequireAuth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { AuthContextValue } from '../../store/auth/auth-context';

jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
    Outlet: () => <div>Private profile</div>,
    useLocation: () => ({ pathname: '/profile' }),
  }),
  { virtual: true },
);

jest.mock('../../store/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const baseAuth: AuthContextValue = {
  user: null,
  accessToken: null,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  isAuthLoading: false,
};

const renderGuard = (auth: Partial<AuthContextValue>) => {
  const authValue = { ...baseAuth, ...auth };
  jest
    .mocked(useAuth)
    .mockImplementation((selector) => selector(authValue));

  return render(<RequireAuth />);
};

describe('RequireAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing while auth state is loading', () => {
    const { container } = renderGuard({ isAuthLoading: true });

    expect(container).toBeEmptyDOMElement();
  });

  test('redirects anonymous users to login', () => {
    renderGuard({ isAuthenticated: false });

    expect(screen.getByText('Navigate to /login')).toBeInTheDocument();
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
