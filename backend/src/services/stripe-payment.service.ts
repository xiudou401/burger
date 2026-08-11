import { ServiceError } from '../errors/ServiceError';
import type { OrderStatus, PaymentStatus } from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';
import {
  type PublicOrder,
  sendOrderConfirmationIfPossible,
  toPublicOrder,
} from './order.service';
import type { StripeCheckoutCompletedSession } from './checkout.types';

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
