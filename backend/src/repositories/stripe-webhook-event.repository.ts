import { StripeWebhookEventModel } from '../models/stripe-webhook-event.model';

const isMongoDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { code?: unknown }).code === 11000;
};

export const stripeWebhookEventRepository = {
  async claim(stripeEventId: string, eventType: string) {
    const now = new Date();

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
    }

    const existing = await StripeWebhookEventModel.findOne({
      stripeEventId,
    }).exec();

    if (!existing || existing.status !== 'failed') {
      return { shouldProcess: false, isDuplicate: true };
    }

    existing.status = 'processing';
    existing.eventType = eventType;
    existing.attempts += 1;
    existing.lastError = undefined;
    existing.lastReceivedAt = now;
    existing.processedAt = undefined;
    await existing.save();

    return { shouldProcess: true, isDuplicate: true };
  },

  markProcessed(stripeEventId: string) {
    return StripeWebhookEventModel.findOneAndUpdate(
      { stripeEventId },
      {
        $set: {
          status: 'processed',
          processedAt: new Date(),
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
