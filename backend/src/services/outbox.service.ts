import { orderRepository } from '../repositories/order.repository';
import { outboxEventRepository } from '../repositories/outbox-event.repository';
import { appLogger } from '../utils/logger';
import { emitCurrentAnalyticsAlerts } from './admin-alert.service';
import {
  sendOrderConfirmationIfPossible,
  toPublicOrder,
} from './order.service';
import { emitOrderEvent } from './realtime.service';

const ORDER_PAID_EVENT_TYPE = 'order.paid';

export const enqueueOrderPaidSideEffects = (order: {
  _id: unknown;
  userId: unknown;
}) =>
  outboxEventRepository.enqueue({
    eventType: ORDER_PAID_EVENT_TYPE,
    eventKey: `${ORDER_PAID_EVENT_TYPE}:${String(order._id)}`,
    aggregateId: String(order._id),
    payload: {
      orderId: String(order._id),
      userId: String(order.userId),
    },
  });

const processOrderPaidEvent = async (payload: Record<string, unknown>) => {
  const orderId = typeof payload.orderId === 'string' ? payload.orderId : '';
  const userId = typeof payload.userId === 'string' ? payload.userId : '';

  if (!orderId || !userId) {
    throw new Error('Invalid order.paid outbox payload');
  }

  const order = await orderRepository.findByIdLean(orderId);

  if (!order) {
    throw new Error('Outbox order not found');
  }

  if (order.status !== 'confirmed' || order.payment.status !== 'paid') {
    throw new Error('Outbox order is not paid');
  }

  const publicOrder = toPublicOrder(order);

  await sendOrderConfirmationIfPossible(userId, publicOrder, {
    throwOnFailure: true,
  });
  emitOrderEvent('order:paid', publicOrder, userId);
  await emitCurrentAnalyticsAlerts();
};

export const processNextOutboxEvent = async () => {
  const claim = await outboxEventRepository.claimNext();

  if (!claim) return false;

  const { event, claimToken } = claim;

  try {
    if (event.eventType === ORDER_PAID_EVENT_TYPE) {
      await processOrderPaidEvent(event.payload);
    } else {
      throw new Error(`Unsupported outbox event type: ${event.eventType}`);
    }

    await outboxEventRepository.markProcessed(event._id, claimToken);
  } catch (error) {
    await outboxEventRepository.markFailed(event._id, claimToken, error);
    appLogger.error('outbox_event_processing_failed', {
      eventId: String(event._id),
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      error,
    });
  }

  return true;
};

export const startOutboxWorker = ({
  intervalMs = 5000,
}: { intervalMs?: number } = {}) => {
  let isRunning = false;

  const tick = async () => {
    if (isRunning) return;

    isRunning = true;

    try {
      while (await processNextOutboxEvent()) {
        // Drain ready events in small batches between interval ticks.
      }
    } catch (error) {
      appLogger.error('outbox_worker_tick_failed', { error });
    } finally {
      isRunning = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  void tick();

  return () => clearInterval(timer);
};
