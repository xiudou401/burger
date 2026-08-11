import {
  CartStoredItem,
  validateCart,
  ValidatedCartMenuItem,
} from './cart.service';
import { ServiceError } from '../errors/ServiceError';
import type { PaymentStatus } from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';
import { toPublicOrder } from './order.service';
import {
  type CheckoutOrder,
  type CheckoutOrderDocument,
} from './checkout.types';
import { createStripeCheckoutSession } from './stripe-checkout.service';

const toOrderSnapshotItem = (menuItem: ValidatedCartMenuItem) => ({
  menuItemId: menuItem.id,
  nameAtPurchase: menuItem.name,
  imageAtPurchase: menuItem.image,
  priceCentsAtPurchase: menuItem.priceCents,
  quantity: menuItem.quantity,
  subtotalCents: menuItem.subtotalCents,
});

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

const isMongoDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { code?: unknown }).code === 11000;
};

const toExistingCheckoutItems = (
  order: CheckoutOrderDocument,
): ValidatedCartMenuItem[] =>
  order.items.map((item) => {
    const menuItemId = item.menuItemId ?? item.mealId;
    const name = item.nameAtPurchase ?? item.name;
    const priceCents = item.priceCentsAtPurchase ?? item.priceCents;

    if (!menuItemId || !name || priceCents === undefined) {
      throw new ServiceError('Checkout order snapshot is incomplete', 500);
    }

    return {
      id: String(menuItemId),
      name,
      image: item.imageAtPurchase ?? item.image,
      priceCents,
      category: 'burger',
      isAvailable: true,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents,
    };
  });

const resetCheckoutPaymentState = (order: CheckoutOrderDocument) => {
  order.status = 'pending_payment';
  order.payment.provider = 'stripe';
  order.payment.status = 'requires_payment';
  order.payment.providerPaymentId = undefined;
  order.payment.paidAt = undefined;
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

  resetCheckoutPaymentState(order);

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

const completeExistingCheckoutOrder = (
  existingOrder: CheckoutOrderDocument,
  idempotencyKey: string,
) => {
  return completeCheckoutOrder(
    existingOrder,
    toExistingCheckoutItems(existingOrder),
    idempotencyKey,
  );
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

  return completeCheckoutOrder(order, validatedCart.items, idempotencyKey);
};
