import { randomUUID } from 'crypto';
import {
  CartStoredItem,
  validateCart,
  ValidatedCartMenuItem,
} from './cart.service';
import { ServiceError } from '../errors/ServiceError';
import { TTL_MS } from '../config/ttl';
import { orderRepository } from '../repositories/order.repository';
import { toPublicOrder } from './order.service';
import {
  type CheckoutOrder,
  type CheckoutOrderDocument,
} from './checkout.types';
import {
  createStripeCheckoutSession,
  retrieveStripeCheckoutSession,
  expireStripeCheckoutSession,
} from './stripe-checkout.service';
import { emitOrderEvent } from './realtime.service';
import { emitCurrentAnalyticsAlerts } from './admin-alert.service';

const toOrderSnapshotItem = (menuItem: ValidatedCartMenuItem) => ({
  menuItemId: menuItem.id,
  nameAtPurchase: menuItem.name,
  imageAtPurchase: menuItem.image,
  categoryAtPurchase: menuItem.category,
  priceCentsAtPurchase: menuItem.priceCents,
  quantity: menuItem.quantity,
  subtotalCents: menuItem.subtotalCents,
});

const isMongoDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { code?: unknown }).code === 11000;
};

const isReusableCheckout = (
  order: CheckoutOrderDocument,
): order is CheckoutOrderDocument & { checkoutUrl: string } =>
  Boolean(order.checkoutUrl) &&
  order.status === 'pending_payment' &&
  order.payment.status === 'requires_payment';

const assertCheckoutCanBeStarted = (order: CheckoutOrderDocument) => {
  if (order.status === 'confirmed' || order.payment.status === 'paid') {
    throw new ServiceError('Order is already paid', 409, {
      code: 'ORDER_ALREADY_PAID',
      orderId: String(order._id),
    });
  }

  if (order.status === 'cancelled' || order.payment.status === 'cancelled') {
    throw new ServiceError('Checkout is no longer available', 409, {
      code: 'CHECKOUT_ENDED',
    });
  }

  if (
    order.status !== 'pending_payment' ||
    !['requires_payment', 'failed'].includes(order.payment.status)
  ) {
    throw new ServiceError('Checkout cannot be started for this order', 409);
  }
};

const getLatestCheckoutOrder = (
  order: CheckoutOrderDocument,
  idempotencyKey: string,
) =>
  orderRepository.findCheckoutByIdempotencyKey(
    String(order.userId),
    idempotencyKey,
  );

const assertStripeCheckoutOpen = async (order: CheckoutOrderDocument) => {
  const sessionId = order.payment.providerPaymentId;
  if (!sessionId?.startsWith('cs_')) {
    throw new ServiceError('Checkout session is unavailable', 409, {
      code: 'CHECKOUT_ENDED',
    });
  }
  const session = await retrieveStripeCheckoutSession(sessionId);
  if (session.payment_status === 'paid' || session.status === 'complete') {
    throw new ServiceError(
      'Payment has been submitted. Please check your order.',
      409,
      { code: 'ORDER_ALREADY_PAID', orderId: String(order._id) },
    );
  }
  if (session.status !== 'open' || session.expires_at * 1000 <= Date.now()) {
    throw new ServiceError(
      'Checkout expired. Please review your cart and try again.',
      409,
      { code: 'CHECKOUT_ENDED' },
    );
  }
};

const hasActiveCheckoutClaim = (order: CheckoutOrderDocument) => {
  const claimedAt = order.payment.checkoutSessionCreationClaimedAt;
  return Boolean(
    order.payment.providerPaymentId?.startsWith('checkout_creation:') &&
    claimedAt &&
    claimedAt.getTime() >= Date.now() - TTL_MS.CHECKOUT_SESSION_CREATION_LEASE,
  );
};

const prepareCheckout = async (
  order: CheckoutOrderDocument,
  idempotencyKey: string,
): Promise<CheckoutOrder> => {
  if (isReusableCheckout(order)) {
    await assertStripeCheckoutOpen(order);
    return {
      order: toPublicOrder(order),
      checkoutUrl: order.checkoutUrl,
    };
  }

  assertCheckoutCanBeStarted(order);

  const claimToken = `checkout_creation:${randomUUID()}`;
  const claimedOrder =
    await orderRepository.claimCheckoutSessionCreationIfPending(
      String(order._id),
      claimToken,
    );

  if (!claimedOrder) {
    const latestOrder = await getLatestCheckoutOrder(order, idempotencyKey);

    if (!latestOrder) {
      throw new ServiceError('Order not found', 404, {
        code: 'ORDER_NOT_FOUND',
      });
    }

    if (isReusableCheckout(latestOrder)) {
      await assertStripeCheckoutOpen(latestOrder);
      return {
        order: toPublicOrder(latestOrder),
        checkoutUrl: latestOrder.checkoutUrl,
      };
    }

    assertCheckoutCanBeStarted(latestOrder);

    if (hasActiveCheckoutClaim(latestOrder)) {
      throw new ServiceError(
        'Checkout is already being prepared. Please retry shortly.',
        409,
        { code: 'CHECKOUT_PREPARING' },
      );
    }

    throw new ServiceError(
      'Checkout could not be prepared. Please try again.',
      409,
      { code: 'CHECKOUT_UNAVAILABLE' },
    );
  }

  try {
    const session = await createStripeCheckoutSession(
      claimedOrder,
      idempotencyKey,
    );

    if (!session.url) {
      await orderRepository.markCheckoutSessionCreationFailedIfClaimed(
        String(claimedOrder._id),
        claimToken,
      );
      throw new ServiceError(
        'Stripe checkout session has no redirect URL',
        502,
      );
    }

    const orderWithCheckoutSession =
      await orderRepository.markCheckoutSessionCreatedIfClaimed(
        String(claimedOrder._id),
        claimToken,
        session.id,
        session.url,
      );

    if (!orderWithCheckoutSession) {
      throw new ServiceError(
        'Checkout state changed while creating session',
        409,
      );
    }

    return {
      order: toPublicOrder(orderWithCheckoutSession),
      checkoutUrl: session.url,
    };
  } catch (error) {
    await orderRepository.markCheckoutSessionCreationFailedIfClaimed(
      String(claimedOrder._id),
      claimToken,
    );

    throw error;
  }
};

const resumeCheckout = (
  existingOrder: CheckoutOrderDocument,
  idempotencyKey: string,
  items: CartStoredItem[],
) => {
  const signature = (entries: Array<{ id: string; quantity: number }>) =>
    entries
      .map(({ id, quantity }) => `${id}:${quantity}`)
      .sort()
      .join('|');
  if (
    signature(items) !==
    signature(
      existingOrder.items.map((item) => ({
        id: String(item.menuItemId),
        quantity: item.quantity,
      })),
    )
  ) {
    throw new ServiceError('Checkout attempt does not match this cart', 409, {
      code: 'CHECKOUT_CART_MISMATCH',
    });
  }
  return prepareCheckout(existingOrder, idempotencyKey);
};

const closeSupersededCheckouts = async (userId: string, keys: string[]) => {
  for (const key of new Set(keys)) {
    const order = await orderRepository.findCheckoutByIdempotencyKey(
      userId,
      key,
    );
    if (!order) continue;
    if (order.payment.status === 'paid' || order.status === 'confirmed') {
      throw new ServiceError('Previous checkout is already paid', 409, {
        code: 'ORDER_ALREADY_PAID',
        orderId: String(order._id),
        supersededCheckoutKey: key,
      });
    }
    let sessionId = order.payment.providerPaymentId;
    if (!sessionId?.startsWith('cs_')) {
      if (order.status === 'cancelled') continue;
      try {
        // Reuse the original key and claim lease to recover an interrupted creator.
        const checkout = await prepareCheckout(order, key);
        sessionId = checkout.order.payment?.providerPaymentId;
      } catch (error) {
        if (
          error instanceof ServiceError &&
          error.details?.code === 'ORDER_ALREADY_PAID'
        ) {
          throw new ServiceError(error.message, error.statusCode, {
            ...error.details,
            supersededCheckoutKey: key,
          });
        }
        if (
          error instanceof ServiceError &&
          error.details?.code === 'CHECKOUT_PREPARING'
        ) {
          throw new ServiceError(
            'Previous checkout is still being prepared. Please retry shortly.',
            409,
            { code: 'CHECKOUT_PREPARING' },
          );
        }
        throw error;
      }
      if (!sessionId?.startsWith('cs_')) {
        throw new ServiceError(
          'Previous checkout could not be recovered',
          409,
          { code: 'CHECKOUT_UNAVAILABLE' },
        );
      }
    }
    let session = await retrieveStripeCheckoutSession(sessionId);
    if (session.status === 'open') {
      try {
        session = await expireStripeCheckoutSession(sessionId);
      } catch (error) {
        // Payment or another request may have won the race to close this Session.
        session = await retrieveStripeCheckoutSession(sessionId);
        if (session.status === 'open') throw error;
      }
    }
    if (session.payment_status === 'paid' || session.status === 'complete') {
      throw new ServiceError(
        'Payment has been submitted. Please check your order.',
        409,
        {
          code: 'ORDER_ALREADY_PAID',
          orderId: String(order._id),
          supersededCheckoutKey: key,
        },
      );
    }
    if (session.status !== 'expired') {
      throw new ServiceError(
        'Could not close previous checkout. Please retry.',
        409,
        { code: 'CHECKOUT_PREPARING' },
      );
    }
    const cancelled = await orderRepository.markStripeCheckoutFailedIfNotPaid(
      sessionId,
      'cancelled',
      'duplicate_order',
    );
    if (cancelled) {
      emitOrderEvent('order:cancelled', toPublicOrder(cancelled), userId);
      void emitCurrentAnalyticsAlerts();
    }
  }
};

export const createCheckoutOrder = async (
  userId: string,
  items: CartStoredItem[],
  menuVersion: number,
  idempotencyKey: string,
  supersededCheckoutKeys: string[] = [],
): Promise<CheckoutOrder> => {
  if (supersededCheckoutKeys.includes(idempotencyKey)) {
    throw new ServiceError('A checkout cannot replace itself', 400);
  }
  await closeSupersededCheckouts(userId, supersededCheckoutKeys);
  const existingOrder = await orderRepository.findCheckoutByIdempotencyKey(
    userId,
    idempotencyKey,
  );

  if (existingOrder) {
    return resumeCheckout(existingOrder, idempotencyKey, items);
  }

  const validatedCart = await validateCart(items, menuVersion);

  if (validatedCart.items.length === 0) {
    throw new ServiceError('Cart is empty', 400);
  }

  let order: CheckoutOrderDocument;

  try {
    order = await orderRepository.create({
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
  } catch (error) {
    if (!isMongoDuplicateKeyError(error)) {
      throw error;
    }

    const racedOrder = await orderRepository.findCheckoutByIdempotencyKey(
      userId,
      idempotencyKey,
    );

    if (!racedOrder) {
      throw error;
    }

    return resumeCheckout(racedOrder, idempotencyKey, items);
  }

  emitOrderEvent('order:created', toPublicOrder(order), String(order.userId));
  void emitCurrentAnalyticsAlerts();

  return prepareCheckout(order, idempotencyKey);
};
