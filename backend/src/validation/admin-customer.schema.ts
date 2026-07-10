import { z } from 'zod';
import { ObjectIdSchema, paginationLimit } from './common.schema';

export const AdminCustomerQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: paginationLimit(20, 100),
    search: z.string().trim().max(80).optional(),
    status: z.enum(['active', 'disabled']).optional(),
  })
  .strict();

export const AdminCustomerParamsSchema = z
  .object({
    customerId: ObjectIdSchema,
  })
  .strict();

export const DisableCustomerSchema = z
  .object({
    reason: z.string().trim().max(240).optional(),
  })
  .strict();

export type AdminCustomerQuery = z.infer<typeof AdminCustomerQuerySchema>;
export type AdminCustomerParams = z.infer<typeof AdminCustomerParamsSchema>;
export type DisableCustomerPayload = z.infer<typeof DisableCustomerSchema>;
