import { z } from 'zod';

export const AdminInsightRequestSchema = z
  .object({
    range: z.enum(['7d', '30d']).default('7d'),
    question: z
      .string()
      .trim()
      .max(240, 'Insight question cannot exceed 240 characters')
      .optional(),
  })
  .strict();

export const AdminInsightCardSchema = z
  .object({
    type: z.enum(['opportunity', 'risk', 'trend']),
    severity: z.enum(['low', 'medium', 'high']),
    title: z.string().trim().min(1).max(120),
    evidence: z.array(z.string().trim().min(1).max(220)).min(1).max(4),
    suggestedAction: z.string().trim().min(1).max(260),
    relatedMenuItemIds: z.array(z.string()).max(5).default([]),
  })
  .strict();

export const AdminInsightResponseSchema = z
  .object({
    summary: z.string().trim().min(1).max(700),
    insights: z.array(AdminInsightCardSchema).min(1).max(4),
  })
  .strict();

export type AdminInsightRequestPayload = z.infer<
  typeof AdminInsightRequestSchema
>;
export type AdminInsightResponsePayload = z.infer<
  typeof AdminInsightResponseSchema
>;
