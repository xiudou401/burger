import { Types } from 'mongoose';
import { OrderModel } from '../models/order.model';
import { orderRepository } from './order.repository';

jest.mock('../models/order.model', () => ({
  OrderModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findById: jest.fn(),
    aggregate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

const chain = (value: unknown) => {
  const exec = jest.fn().mockResolvedValue(value);
  const lean = jest.fn().mockReturnValue({ exec });
  const limit = jest.fn().mockReturnValue({ lean });
  const sort = jest.fn().mockReturnValue({ limit });

  return { exec, lean, limit, sort };
};

describe('orderRepository', () => {
  const userId = '507f1f77bcf86cd799439011';
  const orderId = '507f1f77bcf86cd799439012';
  const menuItemId = '507f1f77bcf86cd799439013';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('scans old Stripe checkouts and unfinished reconciliation markers with a stable cursor', async () => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);
    const before = new Date('2026-11-10T00:00:00Z');
    await orderRepository.listStripeReconciliationCandidates(before, orderId);
    expect(OrderModel.find).toHaveBeenCalledWith({
      'payment.provider': 'stripe',
      'payment.providerPaymentId': /^cs_(test|live)_/,
      $or: [
        { status: 'pending_payment', createdAt: { $lte: before } },
        { 'payment.reconciliationRequired': true },
      ],
      _id: { $gt: new Types.ObjectId(orderId) },
    });
    expect(query.sort).toHaveBeenCalledWith({ _id: 1 });
    expect(query.limit).toHaveBeenCalledWith(25);
  });

  test('does not mark a replacement Stripe session with an old reconciliation result', async () => {
    const exec = jest.fn().mockResolvedValue({ modifiedCount: 0 });
    jest.mocked(OrderModel.updateOne).mockReturnValue({ exec } as never);
    await orderRepository.setStripeReconciliationRequired(
      orderId,
      'cs_test_old',
      false,
    );
    expect(OrderModel.updateOne).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(orderId),
        'payment.providerPaymentId': 'cs_test_old',
      },
      { $set: { 'payment.reconciliationRequired': false } },
    );
  });

  test('lists user orders sorted newest first with a limit', async () => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);

    await expect(orderRepository.listForUser(userId, 5)).resolves.toEqual([]);

    expect(OrderModel.find).toHaveBeenCalledWith({ userId });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.lean).toHaveBeenCalled();
    expect(query.exec).toHaveBeenCalled();
  });

  test('lists all orders after a cursor with stable newest-first sorting', async () => {
    const query = chain([]);
    const cursorDate = new Date('2026-01-02T03:04:05.000Z');

    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);

    await expect(
      orderRepository.listAll(21, {
        createdAt: cursorDate,
        id: orderId,
      }),
    ).resolves.toEqual([]);

    expect(OrderModel.find).toHaveBeenCalledWith({
      $or: [
        { createdAt: { $lt: cursorDate } },
        {
          createdAt: cursorDate,
          _id: { $lt: expect.any(Types.ObjectId) },
        },
      ],
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(query.limit).toHaveBeenCalledWith(21);
    expect(query.lean).toHaveBeenCalled();
    expect(query.exec).toHaveBeenCalled();
  });

  test('lists orders by status sorted by recent updates', async () => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);

    await expect(orderRepository.listByStatus('cancelled', 5)).resolves.toEqual(
      [],
    );

    expect(OrderModel.find).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(query.sort).toHaveBeenCalledWith({
      updatedAt: -1,
      createdAt: -1,
      _id: -1,
    });
    expect(query.limit).toHaveBeenCalledWith(5);
  });

  test('intersects placement dates with the status and cursor before paginating', async () => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);
    const start = new Date('2026-11-01T00:00:00Z');
    const end = new Date('2026-11-11T00:00:00Z');
    await orderRepository.listAll(21, { id: orderId, createdAt: end }, 'past', {
      start,
      end,
    });
    expect(OrderModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: ['completed', 'cancelled'] },
        createdAt: { $gte: start, $lt: end },
        $or: expect.any(Array),
      }),
    );
    expect(query.limit).toHaveBeenCalledWith(21);
  });

  test('loads every active kitchen order oldest first without a page limit', async () => {
    const query = chain([]);
    query.sort.mockReturnValue({ lean: query.lean } as never);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);
    await orderRepository.listKitchen();
    expect(OrderModel.find).toHaveBeenCalledWith({
      status: { $in: ['confirmed', 'preparing', 'ready'] },
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
    expect(query.limit).not.toHaveBeenCalled();
  });

  test.each([
    ['awaiting_payment', 'pending_payment'],
    ['past', { $in: ['completed', 'cancelled'] }],
  ] as const)('filters %s before pagination', async (view, status) => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);
    await orderRepository.listAll(51, undefined, view);
    expect(OrderModel.find).toHaveBeenCalledWith({ status });
    expect(query.limit).toHaveBeenCalledWith(51);
  });

  test('lists paid orders by paidAt range', async () => {
    const query = chain([]);
    const start = new Date('2026-09-20T00:00:00.000Z');
    const end = new Date('2026-09-21T00:00:00.000Z');

    jest.mocked(OrderModel.find).mockReturnValue({ lean: query.lean } as never);

    await expect(orderRepository.listPaidBetween(start, end)).resolves.toEqual(
      [],
    );

    expect(OrderModel.find).toHaveBeenCalledWith({
      cancellationReason: { $ne: 'archived_test_checkout' },
      'payment.status': 'paid',
      'payment.paidAt': {
        $gte: start,
        $lt: end,
      },
    });
    expect(query.lean).toHaveBeenCalled();
  });

  test('finds an order scoped to a user', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const lean = jest.fn().mockReturnValue({ exec });

    jest.mocked(OrderModel.findOne).mockReturnValue({ lean } as never);

    await orderRepository.findForUser(userId, orderId);

    expect(OrderModel.findOne).toHaveBeenCalledWith({
      _id: orderId,
      userId,
    });
    expect(lean).toHaveBeenCalled();
  });

  test('delegates creates and document saves', async () => {
    const order = { _id: 'order-1' };
    const doc = { save: jest.fn().mockResolvedValue(order) };

    jest.mocked(OrderModel.create).mockResolvedValue(order as never);

    await expect(
      orderRepository.create({
        userId,
        items: [
          {
            menuItemId,
            nameAtPurchase: 'Classic Burger',
            priceCentsAtPurchase: 1200,
            quantity: 2,
            subtotalCents: 2400,
          },
        ],
        totalCents: 2400,
        menuVersion: 7,
        status: 'pending_payment',
        payment: {
          status: 'unpaid',
          currency: 'aud',
        },
      }),
    ).resolves.toBe(order);
    await orderRepository.save(doc);

    expect(OrderModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(Types.ObjectId),
        items: [
          expect.objectContaining({
            menuItemId: expect.any(Types.ObjectId),
            nameAtPurchase: 'Classic Burger',
            priceCentsAtPurchase: 1200,
          }),
        ],
      }),
    );
    expect(doc.save).toHaveBeenCalled();
  });

  test('accepts successful retries for the same session without confirming cancelled orders', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    jest.mocked(OrderModel.findOneAndUpdate).mockReturnValue({ exec } as never);
    await orderRepository.markStripeCheckoutPaidIfUnpaid(orderId, 'cs_retry');
    expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending_payment',
        'payment.providerPaymentId': 'cs_retry',
        'payment.status': { $in: ['requires_payment', 'failed'] },
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'confirmed',
          'payment.status': 'paid',
        }),
      }),
      { new: true },
    );
  });

  test('records an archived test payment without promoting it to the kitchen', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    jest.mocked(OrderModel.findOneAndUpdate).mockReturnValue({ exec } as never);
    await orderRepository.markStripeCheckoutPaidIfUnpaid(
      orderId,
      'cs_test_old',
      true,
    );
    expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending_payment',
        'payment.providerPaymentId': 'cs_test_old',
      }),
      {
        $set: expect.objectContaining({
          status: 'cancelled',
          'payment.status': 'paid',
          cancellationReason: 'archived_test_checkout',
        }),
      },
      { new: true },
    );
  });

  test('allows stale checkout session creation claims to be reclaimed', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    jest.mocked(OrderModel.findOneAndUpdate).mockReturnValue({ exec } as never);

    await orderRepository.claimCheckoutSessionCreationIfPending(
      orderId,
      'checkout_creation:new',
    );

    expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: expect.any(Types.ObjectId),
        status: 'pending_payment',
        'payment.status': { $in: ['requires_payment', 'failed'] },
        $and: expect.arrayContaining([
          expect.objectContaining({
            $or: expect.arrayContaining([
              expect.objectContaining({
                $and: expect.arrayContaining([
                  {
                    'payment.providerPaymentId': /^checkout_creation:/,
                  },
                  {
                    $or: expect.arrayContaining([
                      {
                        'payment.checkoutSessionCreationClaimedAt': {
                          $lt: expect.any(Date),
                        },
                      },
                      {
                        'payment.checkoutSessionCreationClaimedAt': {
                          $exists: false,
                        },
                      },
                    ]),
                  },
                ]),
              }),
            ]),
          }),
        ]),
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          'payment.providerPaymentId': 'checkout_creation:new',
          'payment.checkoutSessionCreationClaimedAt': expect.any(Date),
        }),
      }),
      { new: true },
    );
  });

  test('calculates attachment rates with aggregation pipelines', async () => {
    const start = new Date('2026-09-01T00:00:00.000Z');
    const end = new Date('2026-09-08T00:00:00.000Z');
    const exec = jest
      .fn()
      .mockResolvedValueOnce([
        {
          label: 'Burger orders with sides',
          baseCategory: 'burger',
          attachedCategory: 'side',
          baseOrderCount: 10,
          attachedOrderCount: 6,
          attachmentRatePercent: 60,
        },
      ])
      .mockResolvedValueOnce([]);

    jest.mocked(OrderModel.aggregate).mockReturnValue({ exec } as never);

    await expect(
      orderRepository.getAnalyticsAttachmentRates({
        start,
        end,
        pairs: [
          {
            label: 'Burger orders with sides',
            baseCategory: 'burger',
            attachedCategory: 'side',
          },
          {
            label: 'Paid orders with combos',
            attachedCategory: 'combo',
          },
        ],
      }),
    ).resolves.toEqual([
      {
        label: 'Burger orders with sides',
        baseCategory: 'burger',
        attachedCategory: 'side',
        baseOrderCount: 10,
        attachedOrderCount: 6,
        attachmentRatePercent: 60,
      },
      {
        label: 'Paid orders with combos',
        baseCategory: null,
        attachedCategory: 'combo',
        baseOrderCount: 0,
        attachedOrderCount: 0,
        attachmentRatePercent: null,
      },
    ]);

    expect(OrderModel.aggregate).toHaveBeenCalledTimes(2);
    expect(OrderModel.aggregate).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        {
          $match: {
            'payment.paidAt': { $gte: start, $lt: end },
            'payment.status': 'paid',
            cancellationReason: { $ne: 'archived_test_checkout' },
          },
        },
      ]),
    );
  });
});
