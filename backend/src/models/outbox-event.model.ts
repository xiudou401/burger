import { model, Schema } from 'mongoose';

export type OutboxEventType = 'order.paid';
export type OutboxEventStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed';

export interface OutboxEvent {
  _id: unknown;
  eventType: OutboxEventType;
  eventKey: string;
  aggregateId: string;
  status: OutboxEventStatus;
  payload: Record<string, unknown>;
  processingClaimToken?: string;
  attempts: number;
  availableAt: Date;
  processedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const outboxEventSchema = new Schema<OutboxEvent>(
  {
    eventType: {
      type: String,
      enum: ['order.paid'],
      required: true,
      index: true,
    },
    eventKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    aggregateId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      required: true,
      default: 'pending',
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    processingClaimToken: {
      type: String,
      trim: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    availableAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    processedAt: Date,
    lastError: String,
  },
  { timestamps: true },
);

outboxEventSchema.index({ status: 1, availableAt: 1, updatedAt: 1 });

export const OutboxEventModel = model<OutboxEvent>(
  'OutboxEvent',
  outboxEventSchema,
);
