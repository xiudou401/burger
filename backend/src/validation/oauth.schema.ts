import { z } from 'zod';

export const OAuthProviderSchema = z.enum(['google', 'apple']);

export const OAuthModeSchema = z
  .enum(['login', 'signup', 'admin'])
  .catch('login');

export const OAuthProviderParamsSchema = z
  .object({
    provider: OAuthProviderSchema,
  })
  .strict();

export const OAuthStartQuerySchema = z
  .object({
    mode: OAuthModeSchema.optional().default('login'),
  })
  .passthrough();

export const OAuthCallbackQuerySchema = z
  .object({
    state: z.preprocess(
      (value) => (typeof value === 'string' ? value : undefined),
      z.string().trim().min(1).optional(),
    ),
    code: z.preprocess(
      (value) => (typeof value === 'string' ? value : undefined),
      z.string().trim().min(1).optional(),
    ),
  })
  .passthrough();

export type OAuthProviderParamsPayload = z.infer<
  typeof OAuthProviderParamsSchema
>;
export type OAuthStartQueryPayload = z.infer<typeof OAuthStartQuerySchema>;
export type OAuthCallbackQueryPayload = z.infer<
  typeof OAuthCallbackQuerySchema
>;
