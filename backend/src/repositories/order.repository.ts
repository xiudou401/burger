import { Types } from 'mongoose';
import { OrderModel, type Order, type OrderStatus } from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';

type RepositoryOrderItem = Omit<Order['items'][number], 'mealId'> & {
  mealId: string;
};

const toObjectId = (id: string) => new Types.ObjectId(id);
const isObjectId = (id: string) => Types.ObjectId.isValid(id);

export const orderRepository = {
  create(data: {
    userId: string;
    items: RepositoryOrderItem[];
    total: number;
    menuVersion: number;
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
        mealId: toObjectId(item.mealId),
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
    return OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
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

  save<T extends { save: () => Promise<unknown> }>(order: T) {
    return order.save();
  },
};
