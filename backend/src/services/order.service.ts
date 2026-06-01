import { Types } from 'mongoose';
import {
  CartStoredItem,
  validateCart,
  ValidatedCartMeal,
} from './cart.service';
import type { OrderStatus, PaymentStatus } from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';
import { sendOrderConfirmationEmail } from './email.service';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { assertOrderTransition, parseOrderStatus } from '../utils/order-status';

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
  payment?: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt?: Date;
  };
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
  payment?: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt?: Date;
  };
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
  payment: order.payment
    ? {
        provider: order.payment.provider,
        providerPaymentId: order.payment.providerPaymentId,
        status: order.payment.status,
        amount: order.payment.amount,
        currency: order.payment.currency,
        paidAt: order.payment.paidAt,
      }
    : undefined,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const sendOrderConfirmationIfPossible = async (
  userId: string,
  order: PublicOrder,
) => {
  const user = await userRepository.findLeanById(userId);

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

  const order = await orderRepository.create({
    userId: new Types.ObjectId(userId),
    items: validatedCart.items.map(toOrderItem),
    total: validatedCart.total,
    menuVersion: validatedCart.menuVersion,
    status: 'pending_payment',
    payment: {
      status: 'unpaid',
      amount: validatedCart.total,
      currency: 'cny',
    },
  });

  return toPublicOrder(order);
};

export const listOrdersForUser = async (
  userId: string,
  limit = 5,
): Promise<PublicOrder[]> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ServiceError('Invalid user', 400);
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  const orders = await orderRepository.listForUser(userId, safeLimit);

  return orders.map(toPublicOrder);
};

export const listAllOrders = async (limit = 25): Promise<PublicOrder[]> => {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const orders = await orderRepository.listAll(safeLimit);

  return orders.map(toPublicOrder);
};

export const getOrderForUser = async (
  userId: string,
  orderId: string,
): Promise<PublicOrder> => {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(orderId)) {
    throw new ServiceError('Order not found', 404);
  }

  const order = await orderRepository.findForUser(userId, orderId);

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  return toPublicOrder(order);
};

export const getOrderById = async (orderId: string): Promise<PublicOrder> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ServiceError('Order not found', 404);
  }

  const order = await orderRepository.findByIdLean(orderId);

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

  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  assertOrderTransition(order.status, parsedNextStatus);

  order.status = parsedNextStatus;

  if (parsedNextStatus === 'paid') {
    order.payment = order.payment ?? {
      status: 'unpaid',
      amount: order.total,
      currency: 'cny',
    };
    order.payment.status = 'paid';
    order.payment.amount = order.total;
    order.payment.paidAt = order.payment.paidAt ?? new Date();
  }

  await orderRepository.save(order);

  const publicOrder = toPublicOrder(order);

  if (parsedNextStatus === 'paid') {
    await sendOrderConfirmationIfPossible(String(order.userId), publicOrder);
  }

  return publicOrder;
};
