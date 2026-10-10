import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PaymentBar from './PaymentBar';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import type { CartContextValue } from '../../../../types/cart';
import type { AuthContextValue } from '../../../../store/auth/auth-context';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/', search: '' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../api/orders', () => ({
  createCheckoutOrder: vi.fn(),
}));

vi.mock('../../../../store/cart/hooks/useCartSelector', () => ({
  useCartSelector: vi.fn(),
}));

vi.mock('../../../../store/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../UI/Toast/ToastContext', () => ({
  useToast: vi.fn(),
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

const validateQuoteForUserAction = vi.fn();

const cartContext: CartContextValue = {
  items: [cartItem],
  totalQuantity: 2,
  cartDispatch: vi.fn(),
  menuVersion: 1,
  quote: null,
  quoteError: null,
  quoteErrorAction: null,
  quoteNotice: null,
  quoteStale: false,
  quoteMismatch: false,
  displayTotalCents: 1200,
  validateQuoteForUserAction,
  clearQuote: vi.fn(),
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
  login: vi.fn(),
  updateUser: vi.fn(),
  revalidateSession: vi.fn(),
  logout: vi.fn(),
} satisfies AuthContextValue;

describe('PaymentBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateQuoteForUserAction.mockResolvedValue(validatedQuote);
    vi.mocked(useCartSelector).mockImplementation((selector) =>
      selector(cartContext),
    );
    vi.mocked(useAuth).mockImplementation((selector) => selector(authContext));
    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn() });
    vi.mocked(createCheckoutOrder).mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.test/session',
      order: {} as never,
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: vi.fn(),
      },
    });
  });

  test('uses the menu version returned by the validated quote when checking out', async () => {
    render(<PaymentBar totalCents={1200} onOrderComplete={vi.fn()} />);

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

  test('ignores repeated pay clicks while checkout is already in flight', async () => {
    let resolveQuote!: (quote: typeof validatedQuote) => void;
    validateQuoteForUserAction.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveQuote = resolve;
      }),
    );

    render(<PaymentBar totalCents={1200} onOrderComplete={vi.fn()} />);

    const payButton = screen.getByRole('button', { name: 'Pay with Stripe' });
    fireEvent.click(payButton);
    fireEvent.click(payButton);

    expect(validateQuoteForUserAction).toHaveBeenCalledTimes(1);

    resolveQuote(validatedQuote);

    await waitFor(() => {
      expect(createCheckoutOrder).toHaveBeenCalledTimes(1);
    });
  });
});
