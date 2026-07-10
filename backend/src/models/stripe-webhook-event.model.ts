import { model, Schema } from 'mongoose';

export type StripeWebhookEventStatus = 'processing' | 'processed' | 'failed';

export interface StripeWebhookEvent {
  stripeEventId: string;
  eventType: string;
  orderId?: string;
  status: StripeWebhookEventStatus;
  attempts: number;
  lastError?: string;
  processedAt?: Date;
  lastReceivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stripeWebhookEventSchema = new Schema<StripeWebhookEvent>(
  {
    stripeEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed'],
      required: true,
      default: 'processing',
    },
    attempts: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    lastError: String,
    processedAt: Date,
    lastReceivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

stripeWebhookEventSchema.index({ status: 1, updatedAt: -1 });
stripeWebhookEventSchema.index({ orderId: 1, createdAt: -1 });

export const StripeWebhookEventModel = model<StripeWebhookEvent>(
  'StripeWebhookEvent',
  stripeWebhookEventSchema,
);
