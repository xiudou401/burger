import type { Types } from 'mongoose';
import { OrderModel, type Order, type OrderStatus } from '../models/order.model';

export const orderRepository = {
  create(data: {
    userId: Types.ObjectId;
    items: Order['items'];
    total: number;
    menuVersion: number;
    status: OrderStatus;
    payment: Order['payment'];
  }) {
    return OrderModel.create(data);
  },

  listForUser(userId: string, limit: number) {
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
    return OrderModel.findOne({
      _id: orderId,
      userId,
    })
      .lean()
      .exec();
  },

  findByIdLean(orderId: string) {
    return OrderModel.findById(orderId).lean().exec();
  },

  findById(orderId: string) {
    return OrderModel.findById(orderId).exec();
  },

  save<T extends { save: () => Promise<unknown> }>(order: T) {
    return order.save();
  },
};
