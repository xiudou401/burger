import { outboxEventRepository } from '../repositories/outbox-event.repository';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { sendOrderConfirmationEmail } from './email.service';
import { emitCurrentAnalyticsAlerts } from './admin-alert.service';
import { emitOrderEvent } from './realtime.service';
import {
  enqueueOrderPaidSideEffects,
  processNextOutboxEvent,
} from './outbox.service';

jest.mock('../repositories/outbox-event.repository', () => ({
  outboxEventRepository: {
    enqueue: jest.fn(),
    claimNext: jest.fn(),
    markProcessed: jest.fn(),
    markFailed: jest.fn(),
  },
}));

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    findByIdLean: jest.fn(),
  },
}));

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    findLeanById: jest.fn(),
  },
}));

jest.mock('./email.service', () => ({
  sendOrderConfirmationEmail: jest.fn(),
}));

jest.mock('./admin-alert.service', () => ({
  emitCurrentAnalyticsAlerts: jest.fn(),
}));

jest.mock('./realtime.service', () => ({
  emitOrderEvent: jest.fn(),
}));

describe('outbox service', () => {
  const orderId = '507f1f77bcf86cd799439012';
  const userId = '507f1f77bcf86cd799439011';
  const now = new Date('2026-01-01T00:00:00.000Z');
  const order = {
    _id: orderId,
    userId,
    items: [
      {
        menuItemId: '507f1f77bcf86cd799439013',
        nameAtPurchase: 'Classic Burger',
        priceCentsAtPurchase: 1200,
        quantity: 1,
        subtotalCents: 1200,
      },
    ],
    totalCents: 1200,
    menuVersion: 7,
    status: 'confirmed',
    payment: {
      provider: 'stripe',
      providerPaymentId: 'cs_test_123',
      status: 'paid',
      amountCents: 1200,
      currency: 'aud',
      paidAt: now,
    },
    __v: 0,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      _id: userId,
      email: 'pat@example.com',
    } as never);
    jest.mocked(sendOrderConfirmationEmail).mockResolvedValue(undefined);
    jest.mocked(emitCurrentAnalyticsAlerts).mockResolvedValue(undefined);
    jest.mocked(emitOrderEvent).mockImplementation(() => undefined);
  });

  test('enqueues paid order side effects with an idempotent event key', async () => {
    await enqueueOrderPaidSideEffects(order);

    expect(outboxEventRepository.enqueue).toHaveBeenCalledWith({
      eventType: 'order.paid',
      eventKey: `order.paid:${orderId}`,
      aggregateId: orderId,
      payload: {
        orderId,
        userId,
      },
    });
  });

  test.each(['confirmed', 'preparing', 'ready', 'completed'])(
    'processes a paid order event in %s state',
    async (status) => {
      jest.mocked(outboxEventRepository.claimNext).mockResolvedValue({
        claimToken: '11111111-1111-4111-8111-111111111111',
        event: {
          _id: 'event-1',
          eventType: 'order.paid',
          eventKey: `order.paid:${orderId}`,
          aggregateId: orderId,
          status: 'processing',
          payload: { orderId, userId },
          attempts: 1,
          availableAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });
      jest
        .mocked(orderRepository.findByIdLean)
        .mockResolvedValue({ ...order, status } as never);

      await expect(processNextOutboxEvent()).resolves.toBe(true);

      expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'pat@example.com',
          orderId,
          totalCents: 1200,
        }),
      );
      expect(emitOrderEvent).toHaveBeenCalledWith(
        'order:paid',
        expect.objectContaining({ id: orderId }),
        userId,
      );
      expect(emitCurrentAnalyticsAlerts).toHaveBeenCalled();
      expect(outboxEventRepository.markProcessed).toHaveBeenCalledWith(
        'event-1',
        '11111111-1111-4111-8111-111111111111',
      );
      expect(outboxEventRepository.markFailed).not.toHaveBeenCalled();
    },
  );

  test('marks the claimed event failed when a side effect fails', async () => {
    const error = new Error('Email unavailable');

    jest.mocked(outboxEventRepository.claimNext).mockResolvedValue({
      claimToken: '11111111-1111-4111-8111-111111111111',
      event: {
        _id: 'event-1',
        eventType: 'order.paid',
        eventKey: `order.paid:${orderId}`,
        aggregateId: orderId,
        status: 'processing',
        payload: { orderId, userId },
        attempts: 1,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    jest.mocked(orderRepository.findByIdLean).mockResolvedValue(order as never);
    jest.mocked(sendOrderConfirmationEmail).mockRejectedValue(error);

    await expect(processNextOutboxEvent()).resolves.toBe(true);

    expect(outboxEventRepository.markFailed).toHaveBeenCalledWith(
      'event-1',
      '11111111-1111-4111-8111-111111111111',
      error,
    );
    expect(outboxEventRepository.markProcessed).not.toHaveBeenCalled();
  });

  test('returns false when no event is ready', async () => {
    jest.mocked(outboxEventRepository.claimNext).mockResolvedValue(null);

    await expect(processNextOutboxEvent()).resolves.toBe(false);
  });
});
