import { model, Schema, Types } from 'mongoose';

export type AgentRunStatus = 'success' | 'failed';

export interface AgentRunToolCall {
  name: string;
  status: AgentRunStatus;
  latencyMs: number;
}

export interface AgentRun {
  agentName: string;
  actorId: Types.ObjectId;
  prompt: string;
  model: string;
  toolsUsed: string[];
  toolCalls: AgentRunToolCall[];
  latencyMs: number;
  estimatedCostCents?: number;
  status: AgentRunStatus;
  failureReason?: string;
  createdAt: Date;
}

const agentRunToolCallSchema = new Schema<AgentRunToolCall>(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const agentRunSchema = new Schema<AgentRun>(
  {
    agentName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    toolsUsed: {
      type: [String],
      required: true,
      default: [],
    },
    toolCalls: {
      type: [agentRunToolCallSchema],
      required: true,
      default: [],
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedCostCents: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

agentRunSchema.index({ createdAt: -1 });
agentRunSchema.index({ agentName: 1, createdAt: -1 });

export const AgentRunModel = model<AgentRun>('AgentRun', agentRunSchema);
