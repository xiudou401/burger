import { z } from 'zod';
import { ObjectIdSchema, paginationLimit } from './common.schema';

export const MealSortSchema = z.enum([
  'price_asc',
  'price_desc',
  'created_asc',
  'created_desc',
]);

export const MealQuerySchema = z
  .object({
    keyword: z.string().trim().optional(),
    minPrice: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce.number().min(0, 'Minimum price must be non-negative').optional(),
    ),
    maxPrice: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce.number().min(0, 'Maximum price must be non-negative').optional(),
    ),
    page: z.coerce.number().int().positive().default(1),
    limit: paginationLimit(8, 100),
    sort: MealSortSchema.optional(),
  })
  .strict()
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    {
      message: 'Minimum price cannot be greater than maximum price',
      path: ['minPrice'],
    },
  );

export const MealPayloadSchema = z
  .object({
    name: z.string().trim().min(1, 'Meal name is required'),
    description: z.string().trim().optional(),
    price: z.coerce.number().min(0, 'Meal price must be a positive number'),
    image: z.string().trim().optional(),
  })
  .strict();

export const MealParamsSchema = z
  .object({
    mealId: ObjectIdSchema,
  })
  .strict();

export type MealQueryPayload = z.infer<typeof MealQuerySchema>;
export type MealPayload = z.infer<typeof MealPayloadSchema>;
export type MealParamsPayload = z.infer<typeof MealParamsSchema>;
