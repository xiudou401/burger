import dotenv from 'dotenv';
import { z, ZodError } from 'zod';

// Load .env once and export all environment variables from this module.
dotenv.config();

const optionalNonEmptyString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal('').transform(() => undefined));

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.string().trim().min(1).default('3000'),
    MONGO_URI: z.string().trim().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z
      .string()
      .trim()
      .min(32, 'JWT_SECRET must be at least 32 characters'),
    FRONTEND_URL: z.string().trim().url().default('http://localhost:3000'),
    TRUSTED_ORIGINS: z.string().trim().optional(),
    API_URL: z.string().trim().url().optional(),
    GOOGLE_CLIENT_ID: optionalNonEmptyString,
    GOOGLE_CLIENT_SECRET: optionalNonEmptyString,
    APPLE_CLIENT_ID: optionalNonEmptyString,
    RESEND_API_KEY: optionalNonEmptyString,
    EMAIL_FROM: optionalNonEmptyString,
    STRIPE_SECRET_KEY: optionalNonEmptyString,
    STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
    STRIPE_SUCCESS_URL: optionalNonEmptyString,
    STRIPE_CANCEL_URL: optionalNonEmptyString,
  })
  .passthrough()
  .superRefine((parsed, ctx) => {
    if (
      parsed.NODE_ENV === 'production' &&
      (!parsed.RESEND_API_KEY || !parsed.EMAIL_FROM)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'Production email configuration is missing',
      });
    }
  })
  .transform((parsed) => ({
    ...parsed,
    API_URL: parsed.API_URL ?? `http://localhost:${parsed.PORT}`,
    TRUSTED_ORIGINS: Array.from(
      new Set([
        parsed.FRONTEND_URL,
        ...(parsed.TRUSTED_ORIGINS ?? '')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ]),
    ),
  }));

const parseEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.join('.') || 'env';
          return `${path}: ${issue.message}`;
        })
        .join('; ');

      throw new Error(`Invalid environment configuration: ${issues}`);
    }

    throw error;
  }
};

export const env = parseEnv();
