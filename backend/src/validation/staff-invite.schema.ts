import { z } from 'zod';
import { ObjectIdSchema } from './common.schema';

export const CreateStaffInviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    role: z.literal('staff'),
  })
  .strict();

export const AcceptStaffInviteSchema = z
  .object({
    token: z.string().trim().min(1, 'Invite token is required'),
  })
  .strict();

export const StaffInviteParamsSchema = z
  .object({
    inviteId: ObjectIdSchema,
  })
  .strict();

export type CreateStaffInvitePayload = z.infer<typeof CreateStaffInviteSchema>;
export type AcceptStaffInvitePayload = z.infer<typeof AcceptStaffInviteSchema>;
export type StaffInviteParamsPayload = z.infer<typeof StaffInviteParamsSchema>;
