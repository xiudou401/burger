import { Types } from 'mongoose';
import {
  OrderModel,
  type Order,
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

  countActive() {
    return OrderModel.countDocuments({
      status: {
        $in: ['paid', 'preparing', 'ready'],
      },
    });
  },

  async getAnalyticsTotals({ start, end }: AnalyticsRange) {
    const [totals] = await OrderModel.aggregate<OrderAnalyticsTotals>([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          paidOrderCount: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0],
            },
          },
          revenueCents: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$totalCents', 0],
            },
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
          createdAt: { $gte: start, $lt: end },
          'payment.status': 'paid',
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'meals',
          localField: 'items.menuItemId',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      {
        $unwind: {
          path: '$menuItem',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$menuItem.category', 'unknown'] },
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
    sort,
    limit,
  }: AnalyticsRange & {
    sort: Record<string, 1 | -1>;
    limit: number;
  }) {
    return OrderModel.aggregate<OrderAnalyticsItemSale>([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
          'payment.status': 'paid',
        },
      },
      { $unwind: '$items' },
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
