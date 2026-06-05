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
import { env } from '../config/env';
import Stripe from 'stripe';

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

export interface CheckoutOrder {
  order: PublicOrder;
  checkoutUrl: string;
}

let stripeClient: ReturnType<typeof getStripeClientInstance> | null = null;

const getStripeClientInstance = () => new Stripe(env.STRIPE_SECRET_KEY ?? '');

const getStripeClient = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ServiceError('Stripe is not configured', 503);
  }

  stripeClient = stripeClient ?? getStripeClientInstance();

  return stripeClient;
};

const toOrderItem = (meal: ValidatedCartMeal) => ({
  mealId: meal.id,
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
  const validatedCart = await validateCart(items, menuVersion);

  if (validatedCart.items.length === 0) {
    throw new ServiceError('Cart is empty', 400);
  }

  const order = await orderRepository.create({
    userId,
    items: validatedCart.items.map(toOrderItem),
    total: validatedCart.total,
    menuVersion: validatedCart.menuVersion,
    status: 'pending_payment',
    payment: {
      status: 'unpaid',
      amount: validatedCart.total,
      currency: 'aud',
    },
  });

  return toPublicOrder(order);
};

export const createCheckoutOrder = async (
  userId: string,
  items: CartStoredItem[],
  menuVersion: number,
): Promise<CheckoutOrder> => {
  const validatedCart = await validateCart(items, menuVersion);

  if (validatedCart.items.length === 0) {
    throw new ServiceError('Cart is empty', 400);
  }

  const stripe = getStripeClient();

  const order = await orderRepository.create({
    userId,
    items: validatedCart.items.map(toOrderItem),
    total: validatedCart.total,
    menuVersion: validatedCart.menuVersion,
    status: 'pending_payment',
    payment: {
      provider: 'stripe',
      status: 'requires_payment',
      amount: validatedCart.total,
      currency: 'aud',
    },
  });

  const orderId = String(order._id);
  const successUrl =
    env.STRIPE_SUCCESS_URL ??
    `${env.FRONTEND_URL}/profile?payment=success&orderId=${orderId}`;
  const cancelUrl =
    env.STRIPE_CANCEL_URL ??
    `${env.FRONTEND_URL}/profile?payment=cancelled&orderId=${orderId}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: orderId,
    line_items: validatedCart.items.map((item) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: {
      orderId,
      userId,
    },
    payment_intent_data: {
      metadata: {
        orderId,
        userId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new ServiceError('Stripe checkout session has no redirect URL', 502);
  }

  order.payment.providerPaymentId = session.id;
  await orderRepository.save(order);

  return {
    order: toPublicOrder(order),
    checkoutUrl: session.url,
  };
};

export const listOrdersForUser = async (
  userId: string,
  limit = 5,
): Promise<PublicOrder[]> => {
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
  const order = await orderRepository.findForUser(userId, orderId);

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  return toPublicOrder(order);
};

export const getOrderById = async (orderId: string): Promise<PublicOrder> => {
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
      currency: 'aud',
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

export const markStripeCheckoutPaid = async (
  sessionId: string,
): Promise<PublicOrder> => {
  const order = await orderRepository.findByStripeSessionId(sessionId);

  if (!order) {
    throw new ServiceError('Stripe order not found', 404);
  }

  order.status = 'paid';
  order.payment.status = 'paid';
  order.payment.paidAt = order.payment.paidAt ?? new Date();

  await orderRepository.save(order);

  const publicOrder = toPublicOrder(order);
  await sendOrderConfirmationIfPossible(String(order.userId), publicOrder);

  return publicOrder;
};

export const markStripeCheckoutFailed = async (
  sessionId: string,
  paymentStatus: Extract<PaymentStatus, 'failed' | 'cancelled'>,
): Promise<PublicOrder> => {
  const order = await orderRepository.findByStripeSessionId(sessionId);

  if (!order) {
    throw new ServiceError('Stripe order not found', 404);
  }

  order.payment.status = paymentStatus;

  if (paymentStatus === 'cancelled') {
    order.status = 'cancelled';
  }

  await orderRepository.save(order);

  return toPublicOrder(order);
};

export const markStripeOrderFailed = async (
  orderId: string,
): Promise<PublicOrder> => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new ServiceError('Stripe order not found', 404);
  }

  order.payment.status = 'failed';

  await orderRepository.save(order);

  return toPublicOrder(order);
};
