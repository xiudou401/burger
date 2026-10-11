import { randomUUID } from 'crypto';
import { StripeWebhookEventModel } from '../models/stripe-webhook-event.model';

const PROCESSING_LEASE_MS = 5 * 60 * 1000;

type StripeWebhookEventClaim =
  | {
      shouldProcess: true;
      isDuplicate: boolean;
      claimToken: string;
    }
  | {
      shouldProcess: false;
      isDuplicate: true;
      duplicateState: 'processing' | 'processed' | 'failed' | 'unknown';
    };

const isMongoDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { code?: unknown }).code === 11000;
};

export const stripeWebhookEventRepository = {
  async claim(
    stripeEventId: string,
    eventType: string,
  ): Promise<StripeWebhookEventClaim> {
    const now = new Date();
    const claimToken = randomUUID();
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
          processingClaimToken: claimToken,
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
      return { shouldProcess: true, isDuplicate: true, claimToken };
    }

    try {
      await StripeWebhookEventModel.create({
        stripeEventId,
        eventType,
        status: 'processing',
        processingClaimToken: claimToken,
        attempts: 1,
        lastReceivedAt: now,
      });

      return { shouldProcess: true, isDuplicate: false, claimToken };
    } catch (error) {
      if (!isMongoDuplicateKeyError(error)) {
        throw error;
      }

      const existingEvent = await StripeWebhookEventModel.findOne({
        stripeEventId,
      })
        .select({ status: 1 })
        .lean()
        .exec();

      return {
        shouldProcess: false,
        isDuplicate: true,
        duplicateState: existingEvent?.status ?? 'unknown',
      };
    }
  },

  markProcessed(stripeEventId: string, claimToken: string, orderId?: string) {
    return StripeWebhookEventModel.findOneAndUpdate(
      { stripeEventId, status: 'processing', processingClaimToken: claimToken },
      {
        $set: {
          status: 'processed',
          processedAt: new Date(),
          ...(orderId ? { orderId } : {}),
        },
        $unset: {
          lastError: '',
          processingClaimToken: '',
        },
      },
    ).exec();
  },

  markFailed(stripeEventId: string, claimToken: string, error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return StripeWebhookEventModel.findOneAndUpdate(
      { stripeEventId, status: 'processing', processingClaimToken: claimToken },
      {
        $set: {
          status: 'failed',
          lastError: message,
          lastReceivedAt: new Date(),
        },
        $unset: {
          processingClaimToken: '',
        },
      },
    ).exec();
  },
};
