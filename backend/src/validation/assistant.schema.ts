import { z } from 'zod';
import { MENU_ITEM_CATEGORIES } from '../models/menu-item.model';

export const AssistantChatRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, 'Assistant message is required')
      .max(500, 'Assistant message cannot exceed 500 characters'),
  })
  .strict();

export const AssistantMenuItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.enum(MENU_ITEM_CATEGORIES),
    priceCents: z.number().int().min(0),
    description: z.string().optional(),
    isAvailable: z.literal(true),
    reason: z.string().max(180).optional(),
  })
  .strict();

export const AssistantChatResponseSchema = z
  .object({
    reply: z.string(),
    recommendations: z.array(AssistantMenuItemSchema).max(5),
    refused: z.boolean(),
    safetyFlags: z.array(z.string()).default([]),
  })
  .strict();

export const AssistantModelResponseSchema = z
  .object({
    reply: z.string().trim().max(700),
    recommendationIds: z.array(z.string()).max(5).default([]),
    reasonsById: z.record(z.string(), z.string().trim().max(180)).default({}),
    refused: z.boolean().default(false),
    safetyFlags: z.array(z.string()).default([]),
  })
  .strict();

export type AssistantChatRequestPayload = z.infer<
  typeof AssistantChatRequestSchema
>;
export type AssistantChatResponsePayload = z.infer<
  typeof AssistantChatResponseSchema
>;
export type AssistantModelResponsePayload = z.infer<
  typeof AssistantModelResponseSchema
>;
