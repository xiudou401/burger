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

export const AdminAlertInvestigationRequestSchema = z
  .object({
    range: z.enum(['7d', '30d']).default('7d'),
    alertId: z.string().trim().min(1).max(120),
    question: z
      .string()
      .trim()
      .max(240, 'Alert investigation question cannot exceed 240 characters')
      .optional(),
  })
  .strict();

export const AdminInsightChatRequestSchema = z
  .object({
    range: z.enum(['7d', '30d']).default('7d'),
    question: z
      .string()
      .trim()
      .min(1, 'Admin chat question is required')
      .max(240, 'Admin chat question cannot exceed 240 characters'),
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

export const AdminInsightOrderEvidenceSchema = z
  .object({
    orderId: z.string(),
    status: z.string(),
    paymentStatus: z.string().optional(),
    cancellationReason: z.string().optional(),
    cancelledAt: z.string().optional(),
    totalCents: z.number().int().nonnegative(),
    itemCount: z.number().int().nonnegative(),
    items: z.array(z.string()).max(6),
    itemCategories: z.array(z.string()).max(6).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export const AdminInsightResponseSchema = z
  .object({
    summary: z.string().trim().min(1).max(700),
    insights: z.array(AdminInsightCardSchema).min(1).max(4),
    orderEvidence: z.array(AdminInsightOrderEvidenceSchema).max(10).optional(),
  })
  .strict();

export type AdminInsightRequestPayload = z.infer<
  typeof AdminInsightRequestSchema
>;
export type AdminAlertInvestigationRequestPayload = z.infer<
  typeof AdminAlertInvestigationRequestSchema
>;
export type AdminInsightChatRequestPayload = z.infer<
  typeof AdminInsightChatRequestSchema
>;
export type AdminInsightResponsePayload = z.infer<
  typeof AdminInsightResponseSchema
>;
