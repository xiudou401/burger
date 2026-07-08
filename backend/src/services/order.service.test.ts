import { ServiceError } from '../errors/ServiceError';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { sendOrderConfirmationEmail } from './email.service';
import { validateCart } from './cart.service';
import { env } from '../config/env';
import {
  createCheckoutOrder,
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
  markStripeOrderFailed,
  updateOrderStatus,
} from './order.service';

const mockCreateSession = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
  })),
);

jest.mock('./cart.service', () => ({
  validateCart: jest.fn(),
}));

jest.mock('./email.service', () => ({
  sendOrderConfirmationEmail: jest.fn(),
}));

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findByStripeSessionId: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    findLeanById: jest.fn(),
  },
}));

describe('order service', () => {
  const userId = '507f1f77bcf86cd799439011';
  const orderId = '507f1f77bcf86cd799439012';
  const mealId = '507f1f77bcf86cd799439013';
  const now = new Date('2026-01-01T00:00:00.000Z');
  const validatedMeal = {
    id: mealId,
    name: 'Classic Burger',
    image: '/img/burger.png',
    priceCents: 1200,
    category: 'burger',
    isAvailable: true,
    quantity: 2,
    subtotalCents: 2400,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    env.STRIPE_SECRET_KEY = 'sk_test_123';
    env.FRONTEND_URL = 'http://localhost:3000';
    env.STRIPE_SUCCESS_URL = undefined;
    env.STRIPE_CANCEL_URL = undefined;
  });

  test('rejects empty validated carts', async () => {
    jest.mocked(validateCart).mockResolvedValue({
      items: [],
      totalCents: 0,
      menuVersion: 7,
    });

    await expect(createCheckoutOrder(userId, [], 7)).rejects.toThrow(
      ServiceError,
    );
    expect(orderRepository.create).not.toHaveBeenCalled();
  });

  test('creates Stripe checkout sessions for validated orders', async () => {
    jest.mocked(validateCart).mockResolvedValue({
      items: [validatedMeal],
      totalCents: 2400,
      menuVersion: 7,
    });

    const order = {
      _id: orderId,
      userId,
      items: [
        {
          mealId,
          name: 'Classic Burger',
          image: '/img/burger.png',
          priceCents: 1200,
          quantity: 2,
          subtotalCents: 2400,
        },
      ],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: undefined as string | undefined,
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
        paidAt: undefined as Date | undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest.mocked(orderRepository.create).mockResolvedValue(order as never);
    mockCreateSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });

    const checkout = await createCheckoutOrder(
      userId,
      [{ id: mealId, quantity: 2 }],
      7,
    );

    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending_payment',
        payment: {
          provider: 'stripe',
          status: 'requires_payment',
          amountCents: 2400,
          currency: 'aud',
        },
      }),
    );
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        client_reference_id: orderId,
        line_items: [
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({
              currency: 'aud',
              unit_amount: 1200,
            }),
          }),
        ],
        success_url: `http://localhost:3000/profile?payment=success&orderId=${orderId}`,
        cancel_url: `http://localhost:3000/profile?payment=cancelled&orderId=${orderId}`,
      }),
    );
    expect(order.payment.providerPaymentId).toBe('cs_test_123');
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(checkout.checkoutUrl).toBe(
      'https://checkout.stripe.com/c/pay/cs_test_123',
    );
  });

  test('marks checkout orders as failed when Stripe session creation fails', async () => {
    jest.mocked(validateCart).mockResolvedValue({
      items: [validatedMeal],
      totalCents: 2400,
      menuVersion: 7,
    });

    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: undefined as string | undefined,
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
      },
      createdAt: now,
      updatedAt: now,
      save: jest.fn(),
    };

    jest.mocked(orderRepository.create).mockResolvedValue(order as never);
    mockCreateSession.mockRejectedValue(new Error('Stripe unavailable'));

    await expect(
      createCheckoutOrder(userId, [{ id: mealId, quantity: 2 }], 7),
    ).rejects.toThrow('Stripe unavailable');

    expect(order.payment.status).toBe('failed');
    expect(orderRepository.save).toHaveBeenCalledWith(order);
  });

  test('marks checkout orders as failed when Stripe returns no checkout URL', async () => {
    jest.mocked(validateCart).mockResolvedValue({
      items: [validatedMeal],
      totalCents: 2400,
      menuVersion: 7,
    });

    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: undefined as string | undefined,
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
      },
      createdAt: now,
      updatedAt: now,
      save: jest.fn(),
    };

    jest.mocked(orderRepository.create).mockResolvedValue(order as never);
    mockCreateSession.mockResolvedValue({
      id: 'cs_test_123',
      url: null,
    });

    await expect(
      createCheckoutOrder(userId, [{ id: mealId, quantity: 2 }], 7),
    ).rejects.toThrow('Stripe checkout session has no redirect URL');

    expect(order.payment.status).toBe('failed');
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(orderRepository.save).toHaveBeenCalledWith(order);
  });

  test('marks paid orders, persists the change, and sends confirmation email', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [
        {
          mealId,
          name: 'Classic Burger',
          priceCents: 1200,
          quantity: 2,
          subtotalCents: 2400,
        },
      ],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        status: 'unpaid',
        amountCents: 2400,
        currency: 'aud',
        paidAt: undefined as Date | undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest.mocked(orderRepository.findById).mockResolvedValue(order as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      email: 'pat@example.com',
    } as never);

    const result = await updateOrderStatus(orderId, 'paid', 'admin');

    expect(order.status).toBe('paid');
    expect(order.payment.status).toBe('paid');
    expect(order.payment.paidAt).toBeInstanceOf(Date);
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'pat@example.com',
        orderId,
        totalCents: 2400,
      }),
    );
    expect(result.status).toBe('paid');
  });

  test('marks Stripe checkout sessions as paid and sends confirmation email', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [
        {
          mealId,
          name: 'Classic Burger',
          priceCents: 1200,
          quantity: 2,
          subtotalCents: 2400,
        },
      ],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
        paidAt: undefined as Date | undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest
      .mocked(orderRepository.findByStripeSessionId)
      .mockResolvedValue(order as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      email: 'pat@example.com',
    } as never);

    const result = await markStripeCheckoutPaid({
      id: 'cs_test_123',
      payment_status: 'paid',
      amount_total: 2400,
      currency: 'aud',
      metadata: { orderId },
      client_reference_id: orderId,
    });

    expect(order.status).toBe('paid');
    expect(order.payment.status).toBe('paid');
    expect(order.payment.paidAt).toBeInstanceOf(Date);
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ orderId, totalCents: 2400 }),
    );
    expect(result.status).toBe('paid');
  });

  test('does not resend confirmation email for repeated paid Stripe webhooks', async () => {
    const paidAt = new Date('2026-01-01T00:01:00.000Z');
    const order = {
      _id: orderId,
      userId,
      items: [
        {
          mealId,
          name: 'Classic Burger',
          priceCents: 1200,
          quantity: 2,
          subtotalCents: 2400,
        },
      ],
      totalCents: 2400,
      menuVersion: 7,
      status: 'paid',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'paid',
        amountCents: 2400,
        currency: 'aud',
        paidAt,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest
      .mocked(orderRepository.findByStripeSessionId)
      .mockResolvedValue(order as never);

    const result = await markStripeCheckoutPaid({
      id: 'cs_test_123',
      payment_status: 'paid',
      amount_total: 2400,
      currency: 'aud',
      metadata: { orderId },
      client_reference_id: orderId,
    });

    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(result.status).toBe('paid');
    expect(result.payment?.paidAt).toBe(paidAt);
  });

  test('rejects completed Stripe sessions that do not match the order amount', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
      },
      createdAt: now,
      updatedAt: now,
    };

    jest
      .mocked(orderRepository.findByStripeSessionId)
      .mockResolvedValue(order as never);

    await expect(
      markStripeCheckoutPaid({
        id: 'cs_test_123',
        payment_status: 'paid',
        amount_total: 1200,
        currency: 'aud',
        metadata: { orderId },
        client_reference_id: orderId,
      }),
    ).rejects.toThrow('Stripe checkout amount does not match order');

    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  test('marks Stripe checkout sessions as cancelled', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
      },
      createdAt: now,
      updatedAt: now,
    };

    jest
      .mocked(orderRepository.findByStripeSessionId)
      .mockResolvedValue(order as never);

    const result = await markStripeCheckoutFailed('cs_test_123', 'cancelled');

    expect(order.status).toBe('cancelled');
    expect(order.payment.status).toBe('cancelled');
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(result.payment?.status).toBe('cancelled');
  });

  test('ignores late failed checkout events for already paid orders', async () => {
    const paidAt = new Date('2026-01-01T00:01:00.000Z');
    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'paid',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'paid',
        amountCents: 2400,
        currency: 'aud',
        paidAt,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest
      .mocked(orderRepository.findByStripeSessionId)
      .mockResolvedValue(order as never);

    const result = await markStripeCheckoutFailed('cs_test_123', 'cancelled');

    expect(order.status).toBe('paid');
    expect(order.payment.status).toBe('paid');
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(result.status).toBe('paid');
    expect(result.payment?.paidAt).toBe(paidAt);
  });

  test('marks Stripe payment intents as failed by order id', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
      },
      createdAt: now,
      updatedAt: now,
    };

    jest.mocked(orderRepository.findById).mockResolvedValue(order as never);

    const result = await markStripeOrderFailed(orderId);

    expect(order.payment.status).toBe('failed');
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(result.payment?.status).toBe('failed');
  });

  test('ignores late failed payment intents for already paid orders', async () => {
    const paidAt = new Date('2026-01-01T00:01:00.000Z');
    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'paid',
      payment: {
        provider: 'stripe',
        providerPaymentId: 'cs_test_123',
        status: 'paid',
        amountCents: 2400,
        currency: 'aud',
        paidAt,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest.mocked(orderRepository.findById).mockResolvedValue(order as never);

    const result = await markStripeOrderFailed(orderId);

    expect(order.status).toBe('paid');
    expect(order.payment.status).toBe('paid');
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(result.status).toBe('paid');
    expect(result.payment?.paidAt).toBe(paidAt);
  });

  test('rejects invalid order status transitions', async () => {
    jest.mocked(orderRepository.findById).mockResolvedValue({
      _id: orderId,
      status: 'completed',
    } as never);

    await expect(updateOrderStatus(orderId, 'paid', 'admin')).rejects.toThrow(
      ServiceError,
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  test('rejects staff attempts to update non-fulfillment status', async () => {
    jest.mocked(orderRepository.findById).mockResolvedValue({
      _id: orderId,
      status: 'pending_payment',
      payment: {
        status: 'unpaid',
        amountCents: 2400,
        currency: 'aud',
      },
    } as never);

    await expect(updateOrderStatus(orderId, 'paid', 'staff')).rejects.toThrow(
      'Staff can only advance order fulfillment status',
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  test('allows staff to advance fulfillment after payment', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'paid',
      payment: {
        provider: 'stripe',
        status: 'paid',
        amountCents: 2400,
        currency: 'aud',
        paidAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest.mocked(orderRepository.findById).mockResolvedValue(order as never);

    const result = await updateOrderStatus(orderId, 'preparing', 'staff');

    expect(order.status).toBe('preparing');
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(result.status).toBe('preparing');
  });

  test.each(['paid', 'preparing'] as const)(
    'allows admins to cancel %s orders before completion',
    async (status) => {
      const order = {
        _id: orderId,
        userId,
        items: [],
        totalCents: 2400,
        menuVersion: 7,
        status,
        payment: {
          provider: 'stripe',
          status: 'paid',
          amountCents: 2400,
          currency: 'aud',
          paidAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };

      jest.mocked(orderRepository.findById).mockResolvedValue(order as never);

      const result = await updateOrderStatus(orderId, 'cancelled', 'admin');

      expect(order.status).toBe('cancelled');
      expect(order.payment.status).toBe('paid');
      expect(orderRepository.save).toHaveBeenCalledWith(order);
      expect(result.status).toBe('cancelled');
      expect(result.payment?.status).toBe('paid');
    },
  );

  test('rejects staff attempts to cancel paid orders', async () => {
    jest.mocked(orderRepository.findById).mockResolvedValue({
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'paid',
      payment: {
        provider: 'stripe',
        status: 'paid',
        amountCents: 2400,
        currency: 'aud',
        paidAt: now,
      },
      createdAt: now,
      updatedAt: now,
    } as never);

    await expect(
      updateOrderStatus(orderId, 'cancelled', 'staff'),
    ).rejects.toThrow('Staff can only advance order fulfillment status');
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  test('rejects attempts to cancel completed orders', async () => {
    jest.mocked(orderRepository.findById).mockResolvedValue({
      _id: orderId,
      userId,
      items: [],
      totalCents: 2400,
      menuVersion: 7,
      status: 'completed',
      payment: {
        provider: 'stripe',
        status: 'paid',
        amountCents: 2400,
        currency: 'aud',
        paidAt: now,
      },
      createdAt: now,
      updatedAt: now,
    } as never);

    await expect(
      updateOrderStatus(orderId, 'cancelled', 'admin'),
    ).rejects.toThrow('Cannot move order from completed to cancelled');
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  test('rejects manual paid transitions for Stripe orders', async () => {
    jest.mocked(orderRepository.findById).mockResolvedValue({
      _id: orderId,
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        status: 'requires_payment',
        amountCents: 2400,
        currency: 'aud',
      },
    } as never);

    await expect(updateOrderStatus(orderId, 'paid', 'admin')).rejects.toThrow(
      'Stripe payments must be marked paid by webhook',
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
