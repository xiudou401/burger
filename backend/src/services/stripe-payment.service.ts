import { ServiceError } from '../errors/ServiceError';
import type {
  CancellationReason,
  OrderStatus,
  PaymentStatus,
} from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';
import { type PublicOrder, toPublicOrder } from './order.service';
import type { StripeCheckoutCompletedSession } from './checkout.types';
import { emitOrderEvent } from './realtime.service';
import { emitCurrentAnalyticsAlerts } from './admin-alert.service';
import { appLogger } from '../utils/logger';
import { enqueueOrderPaidSideEffects } from './outbox.service';

const isPaidOrder = (order: {
  status: OrderStatus;
  payment: {
    status: PaymentStatus;
  };
}) => order.status === 'confirmed' || order.payment.status === 'paid';

const runStripePaymentSideEffect = async (
  event: string,
  orderId: string,
  task: () => Promise<void> | void,
) => {
  try {
    await task();
  } catch (error) {
    appLogger.error(event, { orderId, error });
  }
};

const emitStripeOrderEventIfPossible = (
  event: 'order:updated' | 'order:paid' | 'order:cancelled',
  order: PublicOrder,
  userId: string,
) =>
  runStripePaymentSideEffect(
    'stripe_order_realtime_emit_failed',
    order.id,
    () => emitOrderEvent(event, order, userId),
  );

const emitStripeAnalyticsAlertsIfPossible = (orderId: string) =>
  runStripePaymentSideEffect(
    'stripe_payment_analytics_alert_emit_failed',
    orderId,
    () => emitCurrentAnalyticsAlerts(),
  );

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

export const markStripeCheckoutPaid = async (
  session: StripeCheckoutCompletedSession,
): Promise<PublicOrder> => {
  const order = await orderRepository.findByStripeSessionId(session.id);

  if (!order) {
    throw new ServiceError('Stripe order not found', 404);
  }

  assertStripeCheckoutMatchesOrder(session, order);

  const wasAlreadyPaid =
    order.status === 'confirmed' && order.payment.status === 'paid';

  if (wasAlreadyPaid) {
    await enqueueOrderPaidSideEffects(order);
    return toPublicOrder(order);
  }

  const paidOrder = await orderRepository.markStripeCheckoutPaidIfUnpaid(
    String(order._id),
    session.id,
  );

  if (!paidOrder) {
    const reviewOrder =
      await orderRepository.markStripeCheckoutPaidRequiresReview(session.id);
    const latestOrder =
      reviewOrder ?? (await orderRepository.findByStripeSessionId(session.id));

    if (!latestOrder) {
      throw new ServiceError('Stripe order not found', 404);
    }

    const publicOrder = toPublicOrder(latestOrder);

    if (reviewOrder) {
      void emitStripeOrderEventIfPossible(
        'order:updated',
        publicOrder,
        String(reviewOrder.userId),
      );
      void emitStripeAnalyticsAlertsIfPossible(publicOrder.id);
    }

    return publicOrder;
  }

  const publicOrder = toPublicOrder(paidOrder);
  await enqueueOrderPaidSideEffects(paidOrder);

  return publicOrder;
};

export const markStripeCheckoutFailed = async (
  sessionId: string,
  paymentStatus: Extract<PaymentStatus, 'failed' | 'cancelled'>,
  cancellationReason?: CancellationReason,
): Promise<PublicOrder> => {
  const order = await orderRepository.findByStripeSessionId(sessionId);

  if (!order) {
    throw new ServiceError('Stripe order not found', 404);
  }

  if (isPaidOrder(order)) {
    return toPublicOrder(order);
  }

  const failedOrder = await orderRepository.markStripeCheckoutFailedIfNotPaid(
    sessionId,
    paymentStatus,
    cancellationReason,
  );

  if (!failedOrder) {
    const latestOrder = await orderRepository.findByStripeSessionId(sessionId);

    if (!latestOrder) {
      throw new ServiceError('Stripe order not found', 404);
    }

    return toPublicOrder(latestOrder);
  }

  const publicOrder = toPublicOrder(failedOrder);
  void emitStripeOrderEventIfPossible(
    paymentStatus === 'cancelled' ? 'order:cancelled' : 'order:updated',
    publicOrder,
    String(failedOrder.userId),
  );
  void emitStripeAnalyticsAlertsIfPossible(publicOrder.id);

  return publicOrder;
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

  const failedOrder =
    await orderRepository.markStripeOrderFailedIfNotPaid(orderId);

  if (!failedOrder) {
    const latestOrder = await orderRepository.findById(orderId);

    if (!latestOrder) {
      throw new ServiceError('Stripe order not found', 404);
    }

    return toPublicOrder(latestOrder);
  }

  const publicOrder = toPublicOrder(failedOrder);
  void emitStripeOrderEventIfPossible(
    'order:updated',
    publicOrder,
    String(failedOrder.userId),
  );
  void emitStripeAnalyticsAlertsIfPossible(publicOrder.id);

  return publicOrder;
};
