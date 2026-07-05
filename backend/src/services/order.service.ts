import {
  CartStoredItem,
  validateCart,
  ValidatedCartMenuItem,
} from './cart.service';
import type { OrderStatus, PaymentStatus } from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';
import { sendOrderConfirmationEmail } from './email.service';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { assertOrderTransition } from '../utils/order-status';
import { env } from '../config/env';
import type { AuthenticatedUser } from '../types/auth';
import Stripe from 'stripe';

export interface PublicOrderItem {
  mealId: string;
  name: string;
  image?: string;
  priceCents: number;
  quantity: number;
  subtotalCents: number;
}

export interface PublicOrder {
  id: string;
  items: PublicOrderItem[];
  totalCents: number;
  menuVersion: number;
  status: OrderStatus;
  payment?: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amountCents: number;
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

export interface StripeCheckoutCompletedSession {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
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

const toOrderItem = (menuItem: ValidatedCartMenuItem) => ({
  mealId: menuItem.id,
  name: menuItem.name,
  image: menuItem.image,
  priceCents: menuItem.priceCents,
  quantity: menuItem.quantity,
  subtotalCents: menuItem.subtotalCents,
});

const toPublicOrder = (order: {
  _id: unknown;
  items: Array<{
    mealId: unknown;
    name: string;
    image?: string;
    priceCents: number;
    quantity: number;
    subtotalCents: number;
  }>;
  totalCents: number;
  menuVersion: number;
  status: OrderStatus;
  payment?: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amountCents: number;
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
    priceCents: item.priceCents,
    quantity: item.quantity,
    subtotalCents: item.subtotalCents,
  })),
  totalCents: order.totalCents,
  menuVersion: order.menuVersion,
  status: order.status,
  payment: order.payment
    ? {
        provider: order.payment.provider,
        providerPaymentId: order.payment.providerPaymentId,
        status: order.payment.status,
        amountCents: order.payment.amountCents,
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
      totalCents: order.totalCents,
    });
  } catch (error) {
    console.error('Order confirmation email failed', error);
  }
};

const markCheckoutOrderFailed = async <
  T extends {
    save: () => Promise<unknown>;
    payment: {
      status: PaymentStatus;
    };
  },
>(
  order: T,
) => {
  order.payment.status = 'failed';
  await orderRepository.save(order);
};

const isPaidOrder = (order: {
  status: OrderStatus;
  payment: {
    status: PaymentStatus;
  };
}) => order.status === 'paid' || order.payment.status === 'paid';

const assertStripeCheckoutMatchesOrder = (
  session: StripeCheckoutCompletedSession,
  order: {
    _id: unknown;
    totalCents: number;
  },
) => {
  const orderId = String(order._id);

  if (session.payment_status !== 'paid') {
    throw new ServiceError('Stripe checkout session is not paid', 400);
  }

  if (session.amount_total !== order.totalCents) {
    throw new ServiceError('Stripe checkout amount does not match order', 400);
  }

  if (session.currency?.toLowerCase() !== 'aud') {
    throw new ServiceError(
      'Stripe checkout currency does not match order',
      400,
    );
  }

  if (session.metadata?.orderId !== orderId) {
    throw new ServiceError(
      'Stripe checkout metadata does not match order',
      400,
    );
  }

  if (session.client_reference_id !== orderId) {
    throw new ServiceError(
      'Stripe checkout client reference does not match order',
      400,
    );
  }
};

const buildStripeReturnUrl = (
  configuredUrl: string | undefined,
  payment: 'success' | 'cancelled',
  orderId: string,
) => {
  const rawUrl =
    configuredUrl ?? `${env.FRONTEND_URL}/profile?payment=${payment}`;
  const url = new URL(rawUrl);

  if (!url.searchParams.has('payment')) {
    url.searchParams.set('payment', payment);
  }

  url.searchParams.set('orderId', orderId);

  return url.toString();
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
    totalCents: validatedCart.totalCents,
    menuVersion: validatedCart.menuVersion,
    status: 'pending_payment',
    payment: {
      provider: 'stripe',
      status: 'requires_payment',
      amountCents: validatedCart.totalCents,
      currency: 'aud',
    },
  });

  const orderId = String(order._id);
  const successUrl = buildStripeReturnUrl(
    env.STRIPE_SUCCESS_URL,
    'success',
    orderId,
  );
  const cancelUrl = buildStripeReturnUrl(
    env.STRIPE_CANCEL_URL,
    'cancelled',
    orderId,
  );

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: orderId,
      line_items: validatedCart.items.map((item) => ({
        price_data: {
          currency: 'aud',
          product_data: {
            name: item.name,
          },
          unit_amount: item.priceCents,
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
      await markCheckoutOrderFailed(order);
      throw new ServiceError(
        'Stripe checkout session has no redirect URL',
        502,
      );
    }

    order.payment.providerPaymentId = session.id;
    await orderRepository.save(order);

    return {
      order: toPublicOrder(order),
      checkoutUrl: session.url,
    };
  } catch (error) {
    if (order.payment.status !== 'failed') {
      await markCheckoutOrderFailed(order);
    }

    throw error;
  }
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
  nextStatus: OrderStatus,
  actorRole: AuthenticatedUser['role'],
): Promise<PublicOrder> => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  assertOrderTransition(order.status, nextStatus);

  if (actorRole !== 'admin') {
    const isStaffFulfillmentTransition =
      (order.status === 'paid' && nextStatus === 'preparing') ||
      (order.status === 'preparing' && nextStatus === 'ready') ||
      (order.status === 'ready' && nextStatus === 'completed');

    if (!isStaffFulfillmentTransition) {
      throw new ServiceError('Staff cannot update payment status', 403);
    }
  }

  if (nextStatus === 'paid' && order.payment?.provider === 'stripe') {
    throw new ServiceError(
      'Stripe payments must be marked paid by webhook',
      400,
    );
  }

  order.status = nextStatus;

  if (nextStatus === 'paid') {
    order.payment = order.payment ?? {
      status: 'unpaid',
      amountCents: order.totalCents,
      currency: 'aud',
    };
    order.payment.status = 'paid';
    order.payment.amountCents = order.totalCents;
    order.payment.paidAt = order.payment.paidAt ?? new Date();
  }

  await orderRepository.save(order);

  const publicOrder = toPublicOrder(order);

  if (nextStatus === 'paid') {
    await sendOrderConfirmationIfPossible(String(order.userId), publicOrder);
  }

  return publicOrder;
};

export const markStripeCheckoutPaid = async (
  session: StripeCheckoutCompletedSession,
): Promise<PublicOrder> => {
  const order = await orderRepository.findByStripeSessionId(session.id);

  if (!order) {
    throw new ServiceError('Stripe order not found', 404);
  }

  assertStripeCheckoutMatchesOrder(session, order);

  const wasAlreadyPaid =
    order.status === 'paid' && order.payment.status === 'paid';

  if (wasAlreadyPaid) {
    return toPublicOrder(order);
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

  if (isPaidOrder(order)) {
    return toPublicOrder(order);
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

  if (isPaidOrder(order)) {
    return toPublicOrder(order);
  }

  order.payment.status = 'failed';

  await orderRepository.save(order);

  return toPublicOrder(order);
};
