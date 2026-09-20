import { Types } from 'mongoose';
import {
  AgentRunModel,
  type AgentRunStatus,
  type AgentRunToolCall,
} from '../models/agent-run.model';

export const agentRunRepository = {
  create(data: {
    agentName: string;
    actorId: string;
    prompt: string;
    model: string;
    toolsUsed: string[];
    toolCalls: AgentRunToolCall[];
    latencyMs: number;
    estimatedCostCents?: number;
    status: AgentRunStatus;
    failureReason?: string;
  }) {
    return AgentRunModel.create({
      ...data,
      actorId: new Types.ObjectId(data.actorId),
    });
  },
};
