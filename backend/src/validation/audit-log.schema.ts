import { z } from 'zod';
import { paginationLimit } from './common.schema';

export const ListAuditLogsQuerySchema = z
  .object({
    limit: paginationLimit(50, 100),
  })
  .strict();

export type ListAuditLogsQueryPayload = z.infer<
  typeof ListAuditLogsQuerySchema
>;
