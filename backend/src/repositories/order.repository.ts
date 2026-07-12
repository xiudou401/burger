import { Types } from 'mongoose';
import {
  OrderModel,
  type Order,
  type OrderStatus,
} from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';

type RepositoryOrderItem = Omit<Order['items'][number], 'menuItemId'> & {
  menuItemId: string;
};

const toObjectId = (id: string) => new Types.ObjectId(id);
const isObjectId = (id: string) => Types.ObjectId.isValid(id);

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

  listAll(limit: number) {
    return OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
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
