import { randomUUID } from 'crypto';
import {
  CartStoredItem,
  validateCart,
  ValidatedCartMenuItem,
} from './cart.service';
import { ServiceError } from '../errors/ServiceError';
import { orderRepository } from '../repositories/order.repository';
import { toPublicOrder } from './order.service';
import {
  type CheckoutOrder,
  type CheckoutOrderDocument,
} from './checkout.types';
import { createStripeCheckoutSession } from './stripe-checkout.service';
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
    throw new ServiceError('Order is already paid', 409);
  }

  if (order.status === 'cancelled' || order.payment.status === 'cancelled') {
    throw new ServiceError('Checkout is no longer available', 409);
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

const completeCheckoutOrder = async (
  order: CheckoutOrderDocument,
  idempotencyKey: string,
): Promise<CheckoutOrder> => {
  if (isReusableCheckout(order)) {
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

    if (latestOrder && isReusableCheckout(latestOrder)) {
      return {
        order: toPublicOrder(latestOrder),
        checkoutUrl: latestOrder.checkoutUrl,
      };
    }

    if (latestOrder) {
      assertCheckoutCanBeStarted(latestOrder);
    }

    throw new ServiceError('Checkout is already being prepared', 409);
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

    const completedOrder =
      await orderRepository.markCheckoutSessionCreatedIfClaimed(
        String(claimedOrder._id),
        claimToken,
        session.id,
        session.url,
      );

    if (!completedOrder) {
      throw new ServiceError(
        'Checkout state changed while creating session',
        409,
      );
    }

    return {
      order: toPublicOrder(completedOrder),
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

const completeExistingCheckoutOrder = (
  existingOrder: CheckoutOrderDocument,
  idempotencyKey: string,
) => {
  return completeCheckoutOrder(existingOrder, idempotencyKey);
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
    return completeExistingCheckoutOrder(existingOrder, idempotencyKey);
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

    return completeExistingCheckoutOrder(racedOrder, idempotencyKey);
  }

  emitOrderEvent('order:created', toPublicOrder(order), String(order.userId));
  void emitCurrentAnalyticsAlerts();

  return completeCheckoutOrder(order, idempotencyKey);
};
