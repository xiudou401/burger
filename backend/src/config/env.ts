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
    PORT: z.string().trim().min(1).default('3000'),
    MONGO_URI: z.string().trim().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().trim().min(1).default('dev-secret-change-me'),
    FRONTEND_URL: z.string().trim().url().default('http://localhost:3000'),
    API_URL: z.string().trim().url().optional(),
    GOOGLE_CLIENT_ID: optionalNonEmptyString,
    GOOGLE_CLIENT_SECRET: optionalNonEmptyString,
    APPLE_CLIENT_ID: optionalNonEmptyString,
    RESEND_API_KEY: optionalNonEmptyString,
    EMAIL_FROM: optionalNonEmptyString,
  })
  .passthrough()
  .transform((parsed) => ({
    ...parsed,
    API_URL: parsed.API_URL ?? `http://localhost:${parsed.PORT}`,
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
