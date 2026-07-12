import Stripe from 'stripe';
import {
  CartStoredItem,
  validateCart,
  ValidatedCartMenuItem,
} from './cart.service';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import type { OrderStatus, PaymentStatus } from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';
import {
  type PublicOrder,
  sendOrderConfirmationIfPossible,
  toPublicOrder,
} from './order.service';

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

const toOrderSnapshotItem = (menuItem: ValidatedCartMenuItem) => ({
  menuItemId: menuItem.id,
  nameAtPurchase: menuItem.name,
  imageAtPurchase: menuItem.image,
  priceCentsAtPurchase: menuItem.priceCents,
  quantity: menuItem.quantity,
  subtotalCents: menuItem.subtotalCents,
});

type CheckoutOrderDocument = {
  _id: unknown;
  userId: unknown;
  items: Array<{
    menuItemId?: unknown;
    nameAtPurchase?: string;
    imageAtPurchase?: string;
    priceCentsAtPurchase?: number;
    mealId?: unknown;
    name?: string;
    image?: string;
    priceCents?: number;
    quantity: number;
    subtotalCents: number;
  }>;
  totalCents: number;
  menuVersion: number;
  checkoutUrl?: string;
  status: OrderStatus;
  payment: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
    paidAt?: Date;
  };
  __v?: number;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<unknown>;
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
    configuredUrl ?? `${env.FRONTEND_URL}/payment/return?payment=${payment}`;
  const url = new URL(rawUrl);

  if (!url.searchParams.has('payment')) {
    url.searchParams.set('payment', payment);
  }

  url.searchParams.set('orderId', orderId);

  return url.toString();
};

const buildStripeIdempotencyKey = (userId: string, idempotencyKey: string) =>
  `checkout:${userId}:${idempotencyKey}`;

const createStripeCheckoutSession = async (
  order: CheckoutOrderDocument,
  items: ValidatedCartMenuItem[],
  idempotencyKey: string,
) => {
  const orderId = String(order._id);
  const userId = String(order.userId);
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

  return getStripeClient().checkout.sessions.create(
    {
      mode: 'payment',
      client_reference_id: orderId,
      line_items: items.map((item) => ({
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
    },
    {
      idempotencyKey: buildStripeIdempotencyKey(userId, idempotencyKey),
    },
  );
};

const completeCheckoutOrder = async (
  order: CheckoutOrderDocument,
  items: ValidatedCartMenuItem[],
  idempotencyKey: string,
): Promise<CheckoutOrder> => {
  if (order.checkoutUrl) {
    return {
      order: toPublicOrder(order),
      checkoutUrl: order.checkoutUrl,
    };
  }

  try {
    const session = await createStripeCheckoutSession(
      order,
      items,
      idempotencyKey,
    );

    if (!session.url) {
      await markCheckoutOrderFailed(order);
      throw new ServiceError(
        'Stripe checkout session has no redirect URL',
        502,
      );
    }

    order.payment.providerPaymentId = session.id;
    order.checkoutUrl = session.url;
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

export const createCheckoutOrder = async (
  userId: string,
  items: CartStoredItem[],
  menuVersion: number,
  idempotencyKey: string,
): Promise<CheckoutOrder> => {
  const existingOrder = await orderRepository.findCheckoutByIdempotencyKey(
    userId,
    idempotencyKey,
  );

  if (existingOrder) {
    const existingCheckoutItems = existingOrder.items.map((item) => ({
      id: String(item.menuItemId),
      name: item.nameAtPurchase,
      image: item.imageAtPurchase,
      priceCents: item.priceCentsAtPurchase,
      category: 'burger',
      isAvailable: true,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents,
    }));

    return completeCheckoutOrder(
      existingOrder,
      existingCheckoutItems,
      idempotencyKey,
    );
  }

  const validatedCart = await validateCart(items, menuVersion);

  if (validatedCart.items.length === 0) {
    throw new ServiceError('Cart is empty', 400);
  }

  const order = await orderRepository.create({
    userId,
    items: validatedCart.items.map(toOrderSnapshotItem),
    totalCents: validatedCart.totalCents,
    menuVersion: validatedCart.menuVersion,
    checkoutIdempotencyKey: idempotencyKey,
    status: 'pending_payment',
    payment: {
      provider: 'stripe',
      status: 'requires_payment',
      amountCents: validatedCart.totalCents,
      currency: 'aud',
    },
  });

  return completeCheckoutOrder(order, validatedCart.items, idempotencyKey);
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
