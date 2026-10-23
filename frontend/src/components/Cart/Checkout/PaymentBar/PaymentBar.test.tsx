import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PaymentBar from './PaymentBar';
import { createCheckoutOrder } from '../../../../api/orders';
import { useCartSelector } from '../../../../store/cart/hooks/useCartSelector';
import { useAuth } from '../../../../store/auth/hooks/useAuth';
import { useToast } from '../../../UI/Toast/ToastContext';
import type { CartContextValue } from '../../../../types/cart';
import type { AuthContextValue } from '../../../../store/auth/auth-context';
import {
  getCheckoutAttempt,
  getSupersededCheckoutKeys,
  finishPaidCheckoutAttempt,
} from '../../../../utils/checkout-attempt';
import { ApiError } from '../../../../api/request';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/', search: '' }),
  useNavigate: () => navigate,
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

const quotedMenuItem = {
  id: 'menu-item-1',
  name: 'Classic Burger',
  description: 'Beef burger',
  priceCents: 1200,
  category: 'burger' as const,
  isAvailable: true,
  quantity: 2,
  subtotalCents: 2400,
  image: '/img/burger.png',
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
    localStorage.clear();
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

  test('checks quote validity while reusing a persisted attempt', async () => {
    const key = getCheckoutAttempt('user-1', [cartItem]);
    render(<PaymentBar totalCents={1200} onOrderComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));
    await waitFor(() =>
      expect(createCheckoutOrder).toHaveBeenCalledWith(
        [cartItem],
        validatedQuote.menuVersion,
        key,
      ),
    );
    expect(validateQuoteForUserAction).toHaveBeenCalledTimes(1);
  });

  test('requires confirmation of the saved order quote before redirecting', async () => {
    const key = getCheckoutAttempt('user-1', [cartItem]);
    vi.mocked(createCheckoutOrder).mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.test/session',
      order: {
        id: 'order-1',
        totalCents: 2800,
        items: [{ menuItemId: cartItem.id, priceCents: 1400, quantity: 2 }],
      } as never,
    });
    render(<PaymentBar totalCents={1200} onOrderComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));
    expect(
      await screen.findByText(/Your saved checkout total is \$28.00/),
    ).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));
    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith(
        'https://checkout.stripe.test/session',
      ),
    );
    expect(createCheckoutOrder).toHaveBeenLastCalledWith(
      [cartItem],
      validatedQuote.menuVersion,
      key,
    );
  });

  test('can continue a changed cart after confirming an older paid checkout', async () => {
    const oldKey = getCheckoutAttempt('user-1', [{ ...cartItem, quantity: 1 }]);
    const currentKey = getCheckoutAttempt('user-1', [cartItem]);
    vi.mocked(createCheckoutOrder).mockRejectedValueOnce(
      new ApiError(409, {
        message: 'Previous checkout is already paid',
        details: {
          code: 'ORDER_ALREADY_PAID',
          orderId: 'order-old',
          supersededCheckoutKey: oldKey,
        },
      }),
    );
    render(<PaymentBar totalCents={1200} onOrderComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/orders/order-old', {
        state: { returnedFromSuccessfulPayment: true },
      }),
    );
    expect(getSupersededCheckoutKeys('user-1')).toEqual([oldKey]);
    // The order page calls this only after fetching a confirmed payment.
    expect(finishPaidCheckoutAttempt('user-1', 'order-old', [cartItem])).toBe(
      false,
    );
    expect(getSupersededCheckoutKeys('user-1')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));
    await waitFor(() =>
      expect(createCheckoutOrder).toHaveBeenLastCalledWith(
        [cartItem],
        validatedQuote.menuVersion,
        currentKey,
      ),
    );
    expect(window.location.assign).toHaveBeenCalled();
  });

  test('stops checkout when the latest quote changes item prices', async () => {
    validateQuoteForUserAction.mockResolvedValueOnce({
      ...validatedQuote,
      menuItems: [{ ...quotedMenuItem, priceCents: 1400 }],
      totalCents: 2800,
    });
    vi.mocked(useCartSelector).mockImplementation((selector) =>
      selector({
        ...cartContext,
        quote: {
          ...validatedQuote,
          menuItems: [quotedMenuItem],
          totalCents: 2400,
        },
      }),
    );

    render(<PaymentBar totalCents={1200} onOrderComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }));

    expect(
      await screen.findByText(
        'Classic Burger price updated to $14.00. Please review before paying.',
      ),
    ).toBeInTheDocument();
    expect(createCheckoutOrder).not.toHaveBeenCalled();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
