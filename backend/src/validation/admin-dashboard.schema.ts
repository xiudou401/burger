import { z } from 'zod';

export const AdminAnalyticsQuerySchema = z
  .object({
    range: z.enum(['7d', '30d']).default('7d'),
  })
  .strict();

export type AdminAnalyticsQueryPayload = z.infer<
  typeof AdminAnalyticsQuerySchema
>;
