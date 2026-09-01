import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PaymentBar from './PaymentBar';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import type { CartContextValue } from '../../../../types/cart';
import type { AuthContextValue } from '../../../../store/auth/auth-context';

jest.mock(
  'react-router-dom',
  () => ({
    useLocation: () => ({ pathname: '/', search: '' }),
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

jest.mock('../../../../api/orders', () => ({
  createCheckoutOrder: jest.fn(),
}));

jest.mock('../../../../store/cart/hooks/useCartSelector', () => ({
  useCartSelector: jest.fn(),
}));

jest.mock('../../../../store/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../UI/Toast/ToastContext', () => ({
  useToast: jest.fn(),
}));

const cartItem = {
  id: 'menu-item-1',
  quantity: 2,
};

const validatedQuote = {
  menuVersion: 2,
  menuItems: [],
  totalCents: 1200,
  ts: Date.now(),
};

const ensureQuote = jest.fn();

const cartContext: CartContextValue = {
  items: [cartItem],
  totalQuantity: 2,
  cartDispatch: jest.fn(),
  menuVersion: 1,
  quote: null,
  quoteError: null,
  quoteErrorAction: null,
  quoteNotice: null,
  quoteStale: false,
  quoteMismatch: false,
  displayTotalCents: 1200,
  ensureQuote,
  clearQuote: jest.fn(),
};

const authContext = {
  user: {
    id: 'user-1',
    email: 'customer@example.com',
    name: 'Customer',
    role: 'customer',
    permissions: ['create_order', 'view_own_orders'],
    emailVerified: true,
  },
  accessToken: 'access-token',
  isAuthenticated: true,
  isAuthLoading: false,
  login: jest.fn(),
  updateUser: jest.fn(),
  logout: jest.fn(),
} satisfies AuthContextValue;

describe('PaymentBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureQuote.mockResolvedValue(validatedQuote);
    jest
      .mocked(useCartSelector)
      .mockImplementation((selector) => selector(cartContext));
    jest
      .mocked(useAuth)
      .mockImplementation((selector) => selector(authContext));
    jest.mocked(useToast).mockReturnValue({ showToast: jest.fn() });
    jest.mocked(createCheckoutOrder).mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.test/session',
      order: {} as never,
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: jest.fn(),
      },
    });
  });

  test('uses the menu version returned by the validated quote when checking out', async () => {
    render(<PaymentBar totalCents={1200} onOrderComplete={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));

    await waitFor(() => {
      expect(createCheckoutOrder).toHaveBeenCalledWith(
        [cartItem],
        validatedQuote.menuVersion,
        expect.any(String),
      );
    });
    expect(createCheckoutOrder).not.toHaveBeenCalledWith(
      [cartItem],
      cartContext.menuVersion,
      expect.any(String),
    );
  });
});
