import { z } from 'zod';

export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

export const paginationLimit = (defaultLimit: number, maxLimit: number) =>
  z.coerce.number().int().positive().max(maxLimit).default(defaultLimit);
