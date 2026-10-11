import { Types } from 'mongoose';
import {
  OrderModel,
  type Order,
  type CancellationReason,
  type PaymentStatus,
  type OrderStatus,
} from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';

type RepositoryOrderItem = Omit<Order['items'][number], 'menuItemId'> & {
  menuItemId: string;
};

const toObjectId = (id: string) => new Types.ObjectId(id);
const isObjectId = (id: string) => Types.ObjectId.isValid(id);

interface OrderCursor {
  createdAt: Date;
  id: string;
}

interface AnalyticsRange {
  start: Date;
  end: Date;
}

interface OrderQueryRange {
  start?: Date;
  end?: Date;
}

export interface OrderAnalyticsTotals {
  orderCount: number;
  paidOrderCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
}

export interface OrderAnalyticsCategorySale {
  category: string;
  quantitySold: number;
  revenueCents: number;
}

export interface OrderAnalyticsItemSale {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenueCents: number;
}

export interface OrderAnalyticsPaymentStatusCount {
  status: PaymentStatus;
  count: number;
}

export interface OrderAnalyticsAttachmentRate {
  label: string;
  baseCategory: string | null;
  attachedCategory: string;
  baseOrderCount: number;
  attachedOrderCount: number;
  attachmentRatePercent: number | null;
}

export const orderRepository = {
  create(data: {
    userId: string;
    items: RepositoryOrderItem[];
    totalCents: number;
    menuVersion: number;
    checkoutIdempotencyKey?: string;
    checkoutUrl?: string;
    status: OrderStatus;
    payment: Order['payment'];
  }) {
    if (!isObjectId(data.userId)) {
      throw new ServiceError('Invalid user', 400);
    }

    return OrderModel.create({
      ...data,
      userId: toObjectId(data.userId),
      items: data.items.map((item) => ({
        ...item,
        menuItemId: toObjectId(item.menuItemId),
      })),
    });
  },

  listForUser(userId: string, limit: number) {
    if (!isObjectId(userId)) {
      throw new ServiceError('Invalid user', 400);
    }

    return OrderModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  },

  listAll(limit: number, cursor?: OrderCursor) {
    const query = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            {
              createdAt: cursor.createdAt,
              _id: { $lt: toObjectId(cursor.id) },
            },
          ],
        }
      : {};

    return OrderModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  },

  listByStatus(status: OrderStatus, limit: number) {
    return OrderModel.find({ status })
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  },

  queryOrders({
    start,
    end,
    status,
    paymentStatus,
    cancellationReason,
    sort,
    limit,
  }: OrderQueryRange & {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    cancellationReason?: CancellationReason;
    sort: 'updated_desc' | 'created_desc' | 'total_desc';
    limit: number;
  }) {
    const query: Record<string, unknown> = {};

    if (start || end) {
      query.createdAt = {
        ...(start ? { $gte: start } : {}),
        ...(end ? { $lt: end } : {}),
      };
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query['payment.status'] = paymentStatus;
    }

    if (cancellationReason) {
      query.cancellationReason = cancellationReason;
    }

    let sortSpec: Record<string, 1 | -1>;

    if (sort === 'total_desc') {
      sortSpec = { totalCents: -1, createdAt: -1, _id: -1 };
    } else if (sort === 'created_desc') {
      sortSpec = { createdAt: -1, _id: -1 };
    } else {
      sortSpec = { updatedAt: -1, createdAt: -1, _id: -1 };
    }

    return OrderModel.find(query).sort(sortSpec).limit(limit).lean().exec();
  },

  listCreatedBetween(start: Date, end: Date) {
    return OrderModel.find({
      createdAt: {
        $gte: start,
        $lt: end,
      },
    })
      .lean()
      .exec();
  },

  listPaidBetween(start: Date, end: Date) {
    return OrderModel.find({
      'payment.status': 'paid',
      'payment.paidAt': {
        $gte: start,
        $lt: end,
      },
    })
      .lean()
      .exec();
  },

  countActive() {
    return OrderModel.countDocuments({
      status: {
        $in: ['confirmed', 'preparing', 'ready'],
      },
    });
  },

  async getAnalyticsTotals({ start, end }: AnalyticsRange) {
    const [totals] = await OrderModel.aggregate<OrderAnalyticsTotals>([
      {
        $facet: {
          createdOrders: [
            {
              $match: {
                createdAt: { $gte: start, $lt: end },
              },
            },
            {
              $count: 'orderCount',
            },
          ],
          paidOrders: [
            {
              $match: {
                'payment.status': 'paid',
                'payment.paidAt': { $gte: start, $lt: end },
              },
            },
            {
              $group: {
                _id: null,
                paidOrderCount: { $sum: 1 },
                revenueCents: { $sum: '$totalCents' },
              },
            },
          ],
        },
      },
      {
        $project: {
          orderCount: {
            $ifNull: [{ $arrayElemAt: ['$createdOrders.orderCount', 0] }, 0],
          },
          paidOrderCount: {
            $ifNull: [{ $arrayElemAt: ['$paidOrders.paidOrderCount', 0] }, 0],
          },
          revenueCents: {
            $ifNull: [{ $arrayElemAt: ['$paidOrders.revenueCents', 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 0,
          orderCount: 1,
          paidOrderCount: 1,
          revenueCents: 1,
          averageOrderValueCents: {
            $cond: [
              { $gt: ['$paidOrderCount', 0] },
              {
                $round: [{ $divide: ['$revenueCents', '$paidOrderCount'] }, 0],
              },
              0,
            ],
          },
        },
      },
    ]).exec();

    return (
      totals ?? {
        orderCount: 0,
        paidOrderCount: 0,
        revenueCents: 0,
        averageOrderValueCents: 0,
      }
    );
  },

  getAnalyticsPaymentStatusCounts({ start, end }: AnalyticsRange) {
    return OrderModel.aggregate<OrderAnalyticsPaymentStatusCount>([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: '$payment.status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      { $sort: { status: 1 } },
    ]).exec();
  },

  getAnalyticsCategorySales({ start, end }: AnalyticsRange) {
    return OrderModel.aggregate<OrderAnalyticsCategorySale>([
      {
        $match: {
          'payment.paidAt': { $gte: start, $lt: end },
          'payment.status': 'paid',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.categoryAtPurchase', 'unknown'] },
          quantitySold: { $sum: '$items.quantity' },
          revenueCents: { $sum: '$items.subtotalCents' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          quantitySold: 1,
          revenueCents: 1,
        },
      },
      { $sort: { revenueCents: -1, quantitySold: -1 } },
    ]).exec();
  },

  getAnalyticsItemSales({
    start,
    end,
    category,
    sort,
    limit,
  }: AnalyticsRange & {
    category?: string;
    sort: Record<string, 1 | -1>;
    limit: number;
  }) {
    return OrderModel.aggregate<OrderAnalyticsItemSale>([
      {
        $match: {
          'payment.paidAt': { $gte: start, $lt: end },
          'payment.status': 'paid',
        },
      },
      { $unwind: '$items' },
      ...(category
        ? [
            {
              $match: {
                'items.categoryAtPurchase': category,
              },
            },
          ]
        : []),
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $last: '$items.nameAtPurchase' },
          quantitySold: { $sum: '$items.quantity' },
          revenueCents: { $sum: '$items.subtotalCents' },
        },
      },
      {
        $project: {
          _id: 0,
          menuItemId: { $toString: '$_id' },
          name: 1,
          quantitySold: 1,
          revenueCents: 1,
        },
      },
      { $sort: sort },
      { $limit: limit },
    ]).exec();
  },

  async getAnalyticsAttachmentRates({
    start,
    end,
    pairs,
  }: AnalyticsRange & {
    pairs: Array<{
      label: string;
      baseCategory?: string;
      attachedCategory: string;
    }>;
  }) {
    return Promise.all(
      pairs.map(async ({ label, baseCategory, attachedCategory }) => {
        const baseExpression = baseCategory
          ? { $in: [baseCategory, '$categories'] }
          : true;
        const attachedExpression = { $in: [attachedCategory, '$categories'] };
        const [result] =
          await OrderModel.aggregate<OrderAnalyticsAttachmentRate>([
            {
              $match: {
                'payment.paidAt': { $gte: start, $lt: end },
                'payment.status': 'paid',
              },
            },
            {
              $project: {
                categories: {
                  $setUnion: [
                    {
                      $filter: {
                        input: { $ifNull: ['$items.categoryAtPurchase', []] },
                        as: 'category',
                        cond: { $ne: ['$$category', null] },
                      },
                    },
                    [],
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                baseOrderCount: {
                  $sum: {
                    $cond: [baseExpression, 1, 0],
                  },
                },
                attachedOrderCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [baseExpression, attachedExpression],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                label,
                baseCategory: baseCategory ?? null,
                attachedCategory,
                baseOrderCount: 1,
                attachedOrderCount: 1,
                attachmentRatePercent: {
                  $cond: [
                    { $gt: ['$baseOrderCount', 0] },
                    {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                '$attachedOrderCount',
                                '$baseOrderCount',
                              ],
                            },
                            100,
                          ],
                        },
                        1,
                      ],
                    },
                    null,
                  ],
                },
              },
            },
          ]).exec();

        return (
          result ?? {
            label,
            baseCategory: baseCategory ?? null,
            attachedCategory,
            baseOrderCount: 0,
            attachedOrderCount: 0,
            attachmentRatePercent: null,
          }
        );
      }),
    );
  },

  findForUser(userId: string, orderId: string) {
    if (!isObjectId(userId) || !isObjectId(orderId)) {
      return Promise.resolve(null);
    }

    return OrderModel.findOne({
      _id: orderId,
      userId,
    })
      .lean()
      .exec();
  },

  findByIdLean(orderId: string) {
    if (!isObjectId(orderId)) {
      return Promise.resolve(null);
    }

    return OrderModel.findById(orderId).lean().exec();
  },

  findById(orderId: string) {
    if (!isObjectId(orderId)) {
      return Promise.resolve(null);
    }

    return OrderModel.findById(orderId).exec();
  },

  findByStripeSessionId(sessionId: string) {
    return OrderModel.findOne({
      'payment.provider': 'stripe',
      'payment.providerPaymentId': sessionId,
    }).exec();
  },

  markStripeCheckoutPaidIfUnpaid(orderId: string, sessionId: string) {
    if (!isObjectId(orderId)) {
      return Promise.resolve(null);
    }

    return OrderModel.findOneAndUpdate(
      {
        _id: toObjectId(orderId),
        'payment.provider': 'stripe',
        'payment.providerPaymentId': sessionId,
        status: 'pending_payment',
        'payment.status': 'requires_payment',
      },
      {
        $set: {
          status: 'confirmed',
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
        },
      },
      { new: true },
    ).exec();
  },

  markStripeCheckoutFailedIfNotPaid(
    sessionId: string,
    paymentStatus: Extract<PaymentStatus, 'failed' | 'cancelled'>,
    cancellationReason?: CancellationReason,
  ) {
    const set: Record<string, unknown> = {
      'payment.status': paymentStatus,
    };

    if (paymentStatus === 'cancelled') {
      set.status = 'cancelled';
      set.cancellationReason =
        cancellationReason ?? 'customer_abandoned_checkout';
      set.cancelledAt = new Date();
    }

    return OrderModel.findOneAndUpdate(
      {
        'payment.provider': 'stripe',
        'payment.providerPaymentId': sessionId,
        status: 'pending_payment',
        'payment.status': 'requires_payment',
      },
      { $set: set },
      { new: true },
    ).exec();
  },

  markStripeOrderFailedIfNotPaid(orderId: string) {
    if (!isObjectId(orderId)) {
      return Promise.resolve(null);
    }

    return OrderModel.findOneAndUpdate(
      {
        _id: toObjectId(orderId),
        status: 'pending_payment',
        'payment.status': 'requires_payment',
      },
      {
        $set: {
          'payment.status': 'failed',
        },
      },
      { new: true },
    ).exec();
  },

  findCheckoutByIdempotencyKey(userId: string, idempotencyKey: string) {
    if (!isObjectId(userId)) {
      return Promise.resolve(null);
    }

    return OrderModel.findOne({
      userId: toObjectId(userId),
      checkoutIdempotencyKey: idempotencyKey,
    }).exec();
  },

  save<T extends { save: () => Promise<unknown> }>(order: T) {
    return order.save();
  },
};
