import { ServiceError } from '../errors/ServiceError';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { sendOrderConfirmationEmail } from './email.service';
import { validateCart } from './cart.service';
import { createOrder, updateOrderStatus } from './order.service';

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates orders from backend-validated cart totals', async () => {
    jest.mocked(validateCart).mockResolvedValue({
      items: [
        {
          id: mealId,
          name: 'Classic Burger',
          image: '/img/burger.png',
          price: 12,
          quantity: 2,
          subtotal: 24,
        },
      ],
      total: 24,
      menuVersion: 7,
    });
    jest.mocked(orderRepository.create).mockResolvedValue({
      _id: orderId,
      userId,
      items: [
        {
          mealId,
          name: 'Classic Burger',
          image: '/img/burger.png',
          price: 12,
          quantity: 2,
          subtotal: 24,
        },
      ],
      total: 24,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        status: 'unpaid',
        amount: 24,
        currency: 'cny',
        paidAt: undefined as Date | undefined,
      },
      createdAt: now,
      updatedAt: now,
    } as never);

    const order = await createOrder(
      userId,
      [{ id: mealId, quantity: 999 }],
      7,
    );

    expect(validateCart).toHaveBeenCalledWith([{ id: mealId, quantity: 999 }], 7);
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 24,
        menuVersion: 7,
        status: 'pending_payment',
        payment: {
          status: 'unpaid',
          amount: 24,
          currency: 'cny',
        },
      }),
    );
    expect(order.total).toBe(24);
    expect(order.items[0].quantity).toBe(2);
  });

  test('rejects empty validated carts', async () => {
    jest.mocked(validateCart).mockResolvedValue({
      items: [],
      total: 0,
      menuVersion: 7,
    });

    await expect(createOrder(userId, [], 7)).rejects.toThrow(ServiceError);
    expect(orderRepository.create).not.toHaveBeenCalled();
  });

  test('marks paid orders, persists the change, and sends confirmation email', async () => {
    const order = {
      _id: orderId,
      userId,
      items: [
        {
          mealId,
          name: 'Classic Burger',
          price: 12,
          quantity: 2,
          subtotal: 24,
        },
      ],
      total: 24,
      menuVersion: 7,
      status: 'pending_payment',
      payment: {
        status: 'unpaid',
        amount: 24,
        currency: 'cny',
        paidAt: undefined as Date | undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    jest.mocked(orderRepository.findById).mockResolvedValue(order as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      email: 'pat@example.com',
    } as never);

    const result = await updateOrderStatus(orderId, 'paid');

    expect(order.status).toBe('paid');
    expect(order.payment.status).toBe('paid');
    expect(order.payment.paidAt).toBeInstanceOf(Date);
    expect(orderRepository.save).toHaveBeenCalledWith(order);
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'pat@example.com',
        orderId,
        total: 24,
      }),
    );
    expect(result.status).toBe('paid');
  });

  test('rejects invalid order status transitions', async () => {
    jest.mocked(orderRepository.findById).mockResolvedValue({
      _id: orderId,
      status: 'completed',
    } as never);

    await expect(updateOrderStatus(orderId, 'paid')).rejects.toThrow(
      ServiceError,
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
