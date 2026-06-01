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

const PhoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone is required')
  .refine(
    (value) => /^\+[1-9]\d{7,14}$/.test(value.replace(/[()\s-]/g, '')),
    'Phone must use E.164 format, for example +61412345678',
  );

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

export const SendSmsCodeSchema = z
  .object({
    phone: PhoneSchema,
  })
  .strict();

export const VerifySmsCodeSchema = z
  .object({
    phone: PhoneSchema,
    code: z.string().regex(/^\d{6}$/, 'SMS code must be 6 digits'),
  })
  .strict();

export type SignupPayload = z.infer<typeof SignupSchema>;
export type LoginPayload = z.infer<typeof LoginSchema>;
export type VerifyEmailPayload = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>;
export type SendSmsCodePayload = z.infer<typeof SendSmsCodeSchema>;
export type VerifySmsCodePayload = z.infer<typeof VerifySmsCodeSchema>;
