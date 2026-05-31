import { z } from 'zod';

export const CreateStaffInviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    role: z.enum(['staff', 'admin']),
  })
  .strict();

export const AcceptStaffInviteSchema = z
  .object({
    token: z.string().trim().min(1, 'Invite token is required'),
  })
  .strict();

export type CreateStaffInvitePayload = z.infer<
  typeof CreateStaffInviteSchema
>;
export type AcceptStaffInvitePayload = z.infer<
  typeof AcceptStaffInviteSchema
>;
