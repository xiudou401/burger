import type { OrderStatus, PaymentStatus } from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';
import { sendOrderConfirmationEmail } from './email.service';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { assertCanTransitionOrderStatus } from '../utils/order-status-machine';
import type { AuthenticatedUser } from '../types/auth';
import { hasPermission } from '../types/permissions';
import { recordAuditLog } from './audit-log.service';
import { appLogger } from '../utils/logger';

export interface PublicOrderItem {
  menuItemId: string;
  nameAtPurchase: string;
  imageAtPurchase?: string;
  priceCentsAtPurchase: number;
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
  version: number;
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

export interface PaginatedPublicOrders {
  orders: PublicOrder[];
  nextCursor: string | null;
}

export const toPublicOrder = (order: {
  _id: unknown;
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
  status: OrderStatus;
  payment?: {
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
}): PublicOrder => ({
  id: String(order._id),
  items: order.items.map((item) => {
    const menuItemId = String(item.menuItemId ?? item.mealId);
    const nameAtPurchase = item.nameAtPurchase ?? item.name ?? '';
    const imageAtPurchase = item.imageAtPurchase ?? item.image;
    const priceCentsAtPurchase =
      item.priceCentsAtPurchase ?? item.priceCents ?? 0;

    return {
      menuItemId,
      nameAtPurchase,
      imageAtPurchase,
      priceCentsAtPurchase,
      mealId: menuItemId,
      name: nameAtPurchase,
      image: imageAtPurchase,
      priceCents: priceCentsAtPurchase,
      quantity: item.quantity,
      subtotalCents: item.subtotalCents,
    };
  }),
  totalCents: order.totalCents,
  menuVersion: order.menuVersion,
  status: order.status,
  version: order.__v ?? 0,
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
export const sendOrderConfirmationIfPossible = async (
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
    appLogger.error('order_confirmation_email_failed', {
      orderId: order.id,
      userId: String(user._id),
      error,
    });
  }
};

const isVersionConflictError = (error: unknown) =>
  error instanceof Error && error.name === 'VersionError';

const throwOrderVersionConflict = () => {
  throw new ServiceError(
    'Order has changed since it was loaded. Please refresh and try again.',
    409,
  );
};

export const listOrdersForUser = async (
  userId: string,
  limit = 5,
): Promise<PublicOrder[]> => {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  const orders = await orderRepository.listForUser(userId, safeLimit);

  return orders.map(toPublicOrder);
};

interface AdminOrderCursor {
  createdAt: Date;
  id: string;
}

const encodeAdminOrderCursor = (order: PublicOrder) => {
  return Buffer.from(
    JSON.stringify({
      createdAt: order.createdAt.toISOString(),
      id: order.id,
    }),
  ).toString('base64url');
};

const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

const decodeAdminOrderCursor = (
  cursor?: string,
): AdminOrderCursor | undefined => {
  if (!cursor) return undefined;

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { createdAt?: unknown; id?: unknown };
    const createdAt =
      typeof decoded.createdAt === 'string'
        ? new Date(decoded.createdAt)
        : null;

    if (
      !createdAt ||
      Number.isNaN(createdAt.getTime()) ||
      typeof decoded.id !== 'string' ||
      !isObjectId(decoded.id)
    ) {
      throw new Error('Invalid cursor');
    }

    return { createdAt, id: decoded.id };
  } catch {
    throw new ServiceError('Invalid orders cursor', 400);
  }
};

export const listAllOrders = async ({
  limit = 20,
  cursor,
}: {
  limit?: number;
  cursor?: string;
} = {}): Promise<PaginatedPublicOrders> => {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const decodedCursor = decodeAdminOrderCursor(cursor);
  const orders = await orderRepository.listAll(safeLimit + 1, decodedCursor);
  const hasMore = orders.length > safeLimit;
  const visibleOrders = orders.slice(0, safeLimit).map(toPublicOrder);

  return {
    orders: visibleOrders,
    nextCursor:
      hasMore && visibleOrders.length > 0
        ? encodeAdminOrderCursor(visibleOrders[visibleOrders.length - 1])
        : null,
  };
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
  expectedVersion: number,
  actor: Pick<AuthenticatedUser, 'id' | 'role' | 'permissions'>,
): Promise<PublicOrder> => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new ServiceError('Order not found', 404);
  }

  if ((order.__v ?? 0) !== expectedVersion) {
    throwOrderVersionConflict();
  }

  const previousStatus = order.status;

  assertCanTransitionOrderStatus(previousStatus, nextStatus);

  if (!hasPermission(actor, 'manage_orders')) {
    const isStaffFulfillmentTransition =
      (order.status === 'paid' && nextStatus === 'preparing') ||
      (order.status === 'preparing' && nextStatus === 'ready') ||
      (order.status === 'ready' && nextStatus === 'completed');

    if (!isStaffFulfillmentTransition) {
      throw new ServiceError(
        'Staff can only advance order fulfillment status',
        403,
      );
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

  try {
    await orderRepository.save(order);
  } catch (error) {
    if (isVersionConflictError(error)) {
      throwOrderVersionConflict();
    }

    throw error;
  }

  const publicOrder = toPublicOrder(order);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'order.status_changed',
    entityType: 'order',
    entityId: publicOrder.id,
    before: { status: previousStatus },
    after: { status: nextStatus },
  });

  if (nextStatus === 'paid') {
    await sendOrderConfirmationIfPossible(String(order.userId), publicOrder);
  }

  return publicOrder;
};
