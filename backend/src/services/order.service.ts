import { Types } from 'mongoose';
import {
  CartStoredItem,
  validateCart,
  ValidatedCartMeal,
} from './cart.service';
import { OrderModel } from '../models/order.model';
import type { OrderStatus } from '../models/order.model';
import { UserModel } from '../models/user.model';
import { ServiceError } from '../errors/ServiceError';
import { sendOrderConfirmationEmail } from './email.service';

export interface PublicOrderItem {
  mealId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface PublicOrder {
  id: string;
  items: PublicOrderItem[];
  total: number;
  menuVersion: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const toOrderItem = (meal: ValidatedCartMeal) => ({
  mealId: new Types.ObjectId(meal.id),
  name: meal.name,
  image: meal.image,
  price: meal.price,
  quantity: meal.quantity,
  subtotal: meal.subtotal,
});

const toPublicOrder = (order: {
  _id: unknown;
  items: Array<{
    mealId: unknown;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  menuVersion: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}): PublicOrder => ({
  id: String(order._id),
  items: order.items.map((item) => ({
    mealId: String(item.mealId),
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  })),
  total: order.total,
  menuVersion: order.menuVersion,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const sendOrderConfirmationIfPossible = async (
  userId: string,
  order: PublicOrder,
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user?.email) {
    return;
  }

  try {
    await sendOrderConfirmationEmail({
      email: user.email,
      orderId: order.id,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items,
      total: order.total,
    });
  } catch (error) {
    console.error('Order confirmation email failed', error);
  }
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

const parseOrderStatus = (status: string): OrderStatus => {
  if (
    !['paid', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)
  ) {
    throw new ServiceError('Invalid order status', 400);
  }

  return status as OrderStatus;
};

export const createOrder = async (
  userId: string,
  items: CartStoredItem[],
  menuVersion: number,
): Promise<PublicOrder> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ServiceError('Invalid user', 400);
  }

  const validatedCart = await validateCart(items, menuVersion);

  if (validatedCart.items.length === 0) {
    throw new ServiceError('Cart is empty', 400);
  }

  const order = await OrderModel.create({
    userId: new Types.ObjectId(userId),
    items: validatedCart.items.map(toOrderItem),
    total: validatedCart.total,
    menuVersion: validatedCart.menuVersion,
    status: 'paid',
  });

  const publicOrder = toPublicOrder(order);
  await sendOrderConfirmationIfPossible(userId, publicOrder);

  return publicOrder;
};

export const listOrdersForUser = async (
  userId: string,
  limit = 5,
): Promise<PublicOrder[]> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ServiceError('Invalid user', 400);
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean()
    .exec();

  return orders.map(toPublicOrder);
};

export const listAllOrders = async (limit = 25): Promise<PublicOrder[]> => {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const orders = await OrderModel.find()
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean()
    .exec();

  return orders.map(toPublicOrder);
};

export const getOrderForUser = async (
  userId: string,
  orderId: string,
): Promise<PublicOrder> => {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(orderId)) {
    throw new ServiceError('Order not found', 404);
  }

  const order = await OrderModel.findOne({
    _id: orderId,
    userId,
  })
    .lean()
    .exec();

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  return toPublicOrder(order);
};

export const getOrderById = async (orderId: string): Promise<PublicOrder> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ServiceError('Order not found', 404);
  }

  const order = await OrderModel.findById(orderId).lean().exec();

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  return toPublicOrder(order);
};

export const updateOrderStatus = async (
  orderId: string,
  nextStatus: string,
): Promise<PublicOrder> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ServiceError('Order not found', 404);
  }

  const parsedNextStatus = parseOrderStatus(nextStatus);

  const order = await OrderModel.findById(orderId).exec();

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  if (!allowedTransitions[order.status].includes(parsedNextStatus)) {
    throw new ServiceError(
      `Cannot move order from ${order.status} to ${parsedNextStatus}`,
      400,
    );
  }

  order.status = parsedNextStatus;
  await order.save();

  return toPublicOrder(order);
};
