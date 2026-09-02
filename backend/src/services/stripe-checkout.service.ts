import Stripe from 'stripe';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import type { CheckoutOrderDocument } from './checkout.types';

let stripeClient: ReturnType<typeof getStripeClientInstance> | null = null;

const getStripeClientInstance = () => new Stripe(env.STRIPE_SECRET_KEY ?? '');

const getStripeClient = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ServiceError('Stripe is not configured', 503);
  }

  stripeClient = stripeClient ?? getStripeClientInstance();

  return stripeClient;
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

const toStripeLineItem = (item: CheckoutOrderDocument['items'][number]) => {
  const name = item.nameAtPurchase ?? item.name;
  const priceCents = item.priceCentsAtPurchase ?? item.priceCents;

  if (!name || priceCents === undefined) {
    throw new ServiceError('Checkout order snapshot is incomplete', 500);
  }

  return {
    price_data: {
      currency: 'aud',
      product_data: {
        name,
      },
      unit_amount: priceCents,
    },
    quantity: item.quantity,
  };
};

export const createStripeCheckoutSession = async (
  order: CheckoutOrderDocument,
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
      line_items: order.items.map(toStripeLineItem),
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
