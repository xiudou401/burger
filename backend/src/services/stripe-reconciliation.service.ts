import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import { orderRepository } from '../repositories/order.repository';
import { retrieveStripeCheckoutSession } from './stripe-checkout.service';
import {
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
} from './stripe-payment.service';
import { appLogger } from '../utils/logger';
import { recoverCheckoutSession } from './checkout-order.service';
import type { CheckoutOrderDocument } from './checkout.types';

const MIN_AGE_MS = 15 * 60 * 1000;
const BATCH_SIZE = 25;

export const reconcileStripeCheckouts = async (
  afterId?: string,
  now = new Date(),
) => {
  const orders = await orderRepository.listStripeReconciliationCandidates(
    new Date(now.getTime() - MIN_AGE_MS),
    afterId,
    BATCH_SIZE,
  );
  const incomplete = await orderRepository.listStripeCheckoutRecoveryCandidates(
    new Date(now.getTime() - MIN_AGE_MS),
    afterId,
    BATCH_SIZE,
  );
  for (const order of [...orders, ...incomplete]) {
    const orderId = String(order._id);
    let sessionId = order.payment.providerPaymentId;
    try {
      if (!sessionId?.startsWith('cs_')) {
        sessionId = await recoverCheckoutSession(
          order as unknown as CheckoutOrderDocument,
        );
      }
      if (!/^cs_(test|live)_/.test(sessionId)) continue;
      const session = await retrieveStripeCheckoutSession(sessionId, {
        expand: ['payment_intent.latest_charge'],
      });
      if (session.payment_status === 'paid') {
        const intent = session.payment_intent;
        const charge =
          typeof intent === 'object' ? intent?.latest_charge : null;
        if (
          !charge ||
          typeof charge === 'string' ||
          charge.status !== 'succeeded' ||
          !charge.captured ||
          !Number.isFinite(charge.created) ||
          charge.created <= 0
        ) {
          await orderRepository.flagUnverifiedStripeCharge(orderId, sessionId);
          throw new ServiceError(
            'Captured Stripe charge unavailable for reconciliation',
            503,
          );
        }
        // Keep a durable retry marker across the paid-update/outbox-write boundary.
        await orderRepository.setStripeReconciliationRequired(
          orderId,
          sessionId,
          true,
        );
        await markStripeCheckoutPaid(session, new Date(charge.created * 1000));
        await orderRepository.setStripeReconciliationRequired(
          orderId,
          sessionId,
          false,
        );
      } else if (
        session.status === 'expired' &&
        session.payment_status === 'unpaid'
      ) {
        await markStripeCheckoutFailed(
          sessionId,
          'cancelled',
          'customer_abandoned_checkout',
        );
        await orderRepository.setStripeReconciliationRequired(
          orderId,
          sessionId,
          false,
        );
        if (order.status === 'cancelled')
          await orderRepository.clearCancelledCheckoutReviewIfClosed(
            orderId,
            sessionId,
          );
      }
    } catch (error) {
      appLogger.error('stripe_checkout_reconciliation_failed', {
        orderId,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }
  const fullBatches = [orders, incomplete].filter(
    (batch) => batch.length === BATCH_SIZE,
  );
  return fullBatches.length
    ? fullBatches.map((batch) => String(batch[batch.length - 1]._id)).sort()[0]
    : undefined;
};

export const startStripeReconciliationWorker = ({
  intervalMs = 5 * 60 * 1000,
}: { intervalMs?: number } = {}) => {
  if (!env.STRIPE_SECRET_KEY) return () => {};
  let running = false;
  let cursor: string | undefined;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      cursor = await reconcileStripeCheckouts(cursor);
    } catch {
      appLogger.error('stripe_reconciliation_tick_failed');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  void tick();
  return () => clearInterval(timer);
};
