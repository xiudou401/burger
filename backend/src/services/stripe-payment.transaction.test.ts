import mongoose, { Types } from 'mongoose';
import { markStripeCheckoutPaid } from './stripe-payment.service';
import { orderRepository } from '../repositories/order.repository';
import { enqueueOrderPaidSideEffects } from './outbox.service';
import { emitOrderEvent } from './realtime.service';

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    findByStripeSessionId: jest.fn(),
    markStripeCheckoutPaidIfPending: jest.fn(),
  },
}));
jest.mock('./outbox.service', () => ({
  enqueueOrderPaidSideEffects: jest.fn(),
}));
jest.mock('./realtime.service', () => ({ emitOrderEvent: jest.fn() }));

describe('Stripe payment transaction', () => {
  const dbSession = {} as mongoose.ClientSession;
  const orderId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const now = new Date();
  const order = {
    _id: orderId,
    userId,
    items: [],
    totalCents: 2400,
    menuVersion: 1,
    status: 'pending_payment',
    payment: {
      provider: 'stripe',
      providerPaymentId: 'cs_test_atomic',
      status: 'requires_payment',
      currency: 'aud',
    },
    createdAt: now,
    updatedAt: now,
  };
  const paidOrder = {
    ...order,
    status: 'confirmed',
    payment: { ...order.payment, status: 'paid', paidAt: now },
  };
  const stripeSession = {
    id: 'cs_test_atomic',
    payment_status: 'paid',
    amount_total: 2400,
    currency: 'aud',
    metadata: { orderId: String(orderId) },
    client_reference_id: String(orderId),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(orderRepository.findByStripeSessionId)
      .mockResolvedValue(order as never);
    jest
      .mocked(orderRepository.markStripeCheckoutPaidIfPending)
      .mockResolvedValue(paidOrder as never);
    jest
      .mocked(enqueueOrderPaidSideEffects)
      .mockReset()
      .mockResolvedValue(undefined);
    jest
      .spyOn(mongoose.connection, 'transaction')
      .mockImplementation(async (work) => {
        const result = await work(dbSession);
        expect(emitOrderEvent).not.toHaveBeenCalled();
        return result;
      });
  });
  afterEach(() => jest.restoreAllMocks());

  test('uses the same session for payment and outbox and emits only after commit', async () => {
    await markStripeCheckoutPaid(stripeSession, now);
    expect(
      orderRepository.markStripeCheckoutPaidIfPending,
    ).toHaveBeenCalledWith(
      String(orderId),
      stripeSession.id,
      now,
      false,
      dbSession,
    );
    expect(enqueueOrderPaidSideEffects).toHaveBeenCalledWith(
      paidOrder,
      dbSession,
    );
    expect(emitOrderEvent).toHaveBeenCalledWith(
      'order:paid',
      expect.objectContaining({ id: String(orderId) }),
      String(userId),
    );
  });

  test.each(['enqueue', 'commit'])(
    'propagates %s failure without emitting a paid notification',
    async (failure) => {
      const error = new Error(`${failure} failed`);
      if (failure === 'enqueue')
        jest.mocked(enqueueOrderPaidSideEffects).mockRejectedValueOnce(error);
      else
        jest
          .mocked(mongoose.connection.transaction)
          .mockImplementationOnce(async (work) => {
            await work(dbSession);
            throw error;
          });
      await expect(markStripeCheckoutPaid(stripeSession, now)).rejects.toBe(
        error,
      );
      expect(emitOrderEvent).not.toHaveBeenCalled();
    },
  );
});
