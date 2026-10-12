import { randomUUID } from 'crypto';
import {
  OutboxEventModel,
  type OutboxEvent,
  type OutboxEventType,
} from '../models/outbox-event.model';

const PROCESSING_LEASE_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;

const isMongoDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  return (error as { code?: unknown }).code === 11000;
};

export const outboxEventRepository = {
  async enqueue(data: {
    eventType: OutboxEventType;
    eventKey: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }) {
    try {
      await OutboxEventModel.create({
        ...data,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
      });
    } catch (error) {
      if (!isMongoDuplicateKeyError(error)) {
        throw error;
      }
    }
  },

  async claimNext(now = new Date()) {
    const claimToken = randomUUID();
    const staleProcessingBefore = new Date(now.getTime() - PROCESSING_LEASE_MS);

    const event = await OutboxEventModel.findOneAndUpdate(
      {
        $or: [
          {
            status: { $in: ['pending', 'failed'] },
            availableAt: { $lte: now },
          },
          {
            status: 'processing',
            updatedAt: { $lt: staleProcessingBefore },
          },
        ],
      },
      {
        $set: {
          status: 'processing',
          processingClaimToken: claimToken,
        },
        $inc: {
          attempts: 1,
        },
        $unset: {
          lastError: '',
          processedAt: '',
        },
      },
      { new: true, sort: { availableAt: 1, createdAt: 1 } },
    )
      .lean<OutboxEvent>()
      .exec();

    return event ? { event, claimToken } : null;
  },

  markProcessed(eventId: unknown, claimToken: string) {
    return OutboxEventModel.findOneAndUpdate(
      { _id: eventId, status: 'processing', processingClaimToken: claimToken },
      {
        $set: {
          status: 'processed',
          processedAt: new Date(),
        },
        $unset: {
          lastError: '',
          processingClaimToken: '',
        },
      },
    ).exec();
  },

  markFailed(eventId: unknown, claimToken: string, error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const availableAt = new Date(Date.now() + RETRY_DELAY_MS);

    return OutboxEventModel.findOneAndUpdate(
      { _id: eventId, status: 'processing', processingClaimToken: claimToken },
      {
        $set: {
          status: 'failed',
          lastError: message,
          availableAt,
        },
        $unset: {
          processingClaimToken: '',
        },
      },
    ).exec();
  },
};
