import { orderRepository } from '../repositories/order.repository';
import { retrieveStripeCheckoutSession } from './stripe-checkout.service';
import {
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
} from './stripe-payment.service';
import {
  reconcileStripeCheckouts,
  startStripeReconciliationWorker,
} from './stripe-reconciliation.service';
import { appLogger } from '../utils/logger';

jest.mock('../config/env', () => ({ env: { STRIPE_SECRET_KEY: 'test-key' } }));
jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    listStripeReconciliationCandidates: jest.fn(),
    setStripeReconciliationRequired: jest.fn(),
    flagUnverifiedStripeCharge: jest.fn(),
  },
}));
jest.mock('./stripe-checkout.service', () => ({
  retrieveStripeCheckoutSession: jest.fn(),
}));
jest.mock('./stripe-payment.service', () => ({
  markStripeCheckoutFailed: jest.fn(),
  markStripeCheckoutPaid: jest.fn(),
}));
jest.mock('../utils/logger', () => ({ appLogger: { error: jest.fn() } }));

const candidate = (id = 'order-A') => ({
  _id: id,
  payment: { providerPaymentId: 'cs_test_' + id },
});
beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(orderRepository.listStripeReconciliationCandidates)
    .mockResolvedValue([candidate()] as never);
});

test('rechecks old orders with a bounded cursor-based scan', async () => {
  jest
    .mocked(orderRepository.listStripeReconciliationCandidates)
    .mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => candidate(String(i))) as never,
    );
  jest
    .mocked(retrieveStripeCheckoutSession)
    .mockResolvedValue({ status: 'open', payment_status: 'unpaid' } as never);
  const now = new Date('2026-11-10T12:00:00Z');
  expect(await reconcileStripeCheckouts('last-id', now)).toBe('24');
  expect(
    orderRepository.listStripeReconciliationCandidates,
  ).toHaveBeenCalledWith(new Date('2026-11-10T11:45:00Z'), 'last-id', 25);
  expect(markStripeCheckoutFailed).not.toHaveBeenCalled();
});

test('only cancels a session confirmed expired and unpaid by Stripe', async () => {
  jest.mocked(retrieveStripeCheckoutSession).mockResolvedValue({
    status: 'expired',
    payment_status: 'unpaid',
  } as never);
  await reconcileStripeCheckouts();
  expect(markStripeCheckoutFailed).toHaveBeenCalledWith(
    'cs_test_order-A',
    'cancelled',
    'customer_abandoned_checkout',
  );
});

const capturedCharge = {
  status: 'succeeded',
  captured: true,
  created: 1788645600,
};

test('paid sessions use the original charge timestamp and durable outbox recovery path', async () => {
  const session = {
    id: 'cs_test_order-A',
    status: 'complete',
    payment_status: 'paid',
    payment_intent: { latest_charge: capturedCharge },
  };
  jest
    .mocked(retrieveStripeCheckoutSession)
    .mockResolvedValue(session as never);
  await reconcileStripeCheckouts();
  expect(retrieveStripeCheckoutSession).toHaveBeenCalledWith(session.id, {
    expand: ['payment_intent.latest_charge'],
  });
  expect(markStripeCheckoutPaid).toHaveBeenCalledWith(
    session,
    new Date(1788645600000),
  );
  expect(
    orderRepository.setStripeReconciliationRequired,
  ).toHaveBeenNthCalledWith(1, 'order-A', session.id, true);
  expect(
    orderRepository.setStripeReconciliationRequired,
  ).toHaveBeenNthCalledWith(2, 'order-A', session.id, false);
  expect(markStripeCheckoutFailed).not.toHaveBeenCalled();
});

test('keeps the retry marker when validation or outbox enqueue fails', async () => {
  jest.mocked(retrieveStripeCheckoutSession).mockResolvedValue({
    payment_status: 'paid',
    payment_intent: { latest_charge: capturedCharge },
  } as never);
  jest.mocked(markStripeCheckoutPaid).mockRejectedValue(new Error('failed'));
  await reconcileStripeCheckouts();
  expect(orderRepository.setStripeReconciliationRequired).toHaveBeenCalledTimes(
    1,
  );
  expect(markStripeCheckoutFailed).not.toHaveBeenCalled();
});

test('flags a paid session for review without inventing a payment time', async () => {
  jest
    .mocked(retrieveStripeCheckoutSession)
    .mockResolvedValue({ payment_status: 'paid' } as never);
  await reconcileStripeCheckouts();
  expect(markStripeCheckoutPaid).not.toHaveBeenCalled();
  expect(orderRepository.flagUnverifiedStripeCharge).toHaveBeenCalledWith(
    'order-A',
    'cs_test_order-A',
  );
  expect(markStripeCheckoutFailed).not.toHaveBeenCalled();
  expect(appLogger.error).toHaveBeenCalled();
});

test('a lookup failure does not cancel an order or prevent later candidates', async () => {
  jest
    .mocked(orderRepository.listStripeReconciliationCandidates)
    .mockResolvedValue([candidate(), candidate('order-B')] as never);
  jest
    .mocked(retrieveStripeCheckoutSession)
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce({
      status: 'expired',
      payment_status: 'unpaid',
    } as never);
  await reconcileStripeCheckouts();
  expect(markStripeCheckoutFailed).toHaveBeenCalledTimes(1);
  expect(orderRepository.flagUnverifiedStripeCharge).not.toHaveBeenCalled();
  expect(markStripeCheckoutFailed).toHaveBeenCalledWith(
    'cs_test_order-B',
    'cancelled',
    'customer_abandoned_checkout',
  );
  expect(appLogger.error).toHaveBeenCalled();
});

test('never cancels complete unpaid sessions or fake session IDs', async () => {
  jest
    .mocked(orderRepository.listStripeReconciliationCandidates)
    .mockResolvedValue([
      candidate(),
      { _id: 'fake', payment: { providerPaymentId: 'cs_demo_1' } },
    ] as never);
  jest.mocked(retrieveStripeCheckoutSession).mockResolvedValue({
    status: 'complete',
    payment_status: 'unpaid',
  } as never);
  await reconcileStripeCheckouts();
  expect(retrieveStripeCheckoutSession).toHaveBeenCalledTimes(1);
  expect(markStripeCheckoutFailed).not.toHaveBeenCalled();
  expect(markStripeCheckoutPaid).not.toHaveBeenCalled();
});

test('starts immediately and stops its scheduled polling', async () => {
  jest.useFakeTimers();
  try {
    jest
      .mocked(orderRepository.listStripeReconciliationCandidates)
      .mockResolvedValue([]);
    const stop = startStripeReconciliationWorker({ intervalMs: 1000 });
    await jest.advanceTimersByTimeAsync(1000);
    expect(
      orderRepository.listStripeReconciliationCandidates,
    ).toHaveBeenCalledTimes(2);
    stop();
    await jest.advanceTimersByTimeAsync(1000);
    expect(
      orderRepository.listStripeReconciliationCandidates,
    ).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});
