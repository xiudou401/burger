import { StripeWebhookEventModel } from '../models/stripe-webhook-event.model';

const PROCESSING_LEASE_MS = 5 * 60 * 1000;

const isMongoDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { code?: unknown }).code === 11000;
};

export const stripeWebhookEventRepository = {
  async claim(stripeEventId: string, eventType: string) {
    const now = new Date();
    const staleProcessingBefore = new Date(now.getTime() - PROCESSING_LEASE_MS);

    const reclaimed = await StripeWebhookEventModel.findOneAndUpdate(
      {
        stripeEventId,
        $or: [
          { status: 'failed' },
          {
            status: 'processing',
            updatedAt: { $lt: staleProcessingBefore },
          },
        ],
      },
      {
        $set: {
          eventType,
          status: 'processing',
          lastReceivedAt: now,
        },
        $inc: {
          attempts: 1,
        },
        $unset: {
          lastError: '',
          processedAt: '',
        },
      },
      { new: true },
    ).exec();

    if (reclaimed) {
      return { shouldProcess: true, isDuplicate: true };
    }

    try {
      await StripeWebhookEventModel.create({
        stripeEventId,
        eventType,
        status: 'processing',
        attempts: 1,
        lastReceivedAt: now,
      });

      return { shouldProcess: true, isDuplicate: false };
    } catch (error) {
      if (!isMongoDuplicateKeyError(error)) {
        throw error;
      }

      return { shouldProcess: false, isDuplicate: true };
    }
  },

  markProcessed(stripeEventId: string, orderId?: string) {
    return StripeWebhookEventModel.findOneAndUpdate(
      { stripeEventId },
      {
        $set: {
          status: 'processed',
          processedAt: new Date(),
          ...(orderId ? { orderId } : {}),
        },
        $unset: {
          lastError: '',
        },
      },
    ).exec();
  },

  markFailed(stripeEventId: string, error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return StripeWebhookEventModel.findOneAndUpdate(
      { stripeEventId },
      {
        $set: {
          status: 'failed',
          lastError: message,
          lastReceivedAt: new Date(),
        },
      },
    ).exec();
  },
};
