import { z } from 'zod';
import {
  PASSWORD_POLICY_MESSAGE,
  validatePasswordPolicy,
} from '../utils/password-policy';

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Invalid email' }));

const PasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine(validatePasswordPolicy, PASSWORD_POLICY_MESSAGE);

const TokenSchema = z.string().trim().min(1, 'Token is required');

export const SignupSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: EmailSchema,
    password: PasswordSchema,
  })
  .strict();

export const LoginSchema = z
  .object({
    email: EmailSchema,
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export const VerifyEmailSchema = z
  .object({
    token: TokenSchema,
  })
  .strict();

export const ForgotPasswordSchema = z
  .object({
    email: EmailSchema,
  })
  .strict();

export const ResetPasswordSchema = z
  .object({
    token: TokenSchema,
    password: PasswordSchema,
  })
  .strict();

export type SignupPayload = z.infer<typeof SignupSchema>;
export type LoginPayload = z.infer<typeof LoginSchema>;
export type VerifyEmailPayload = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>;
