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
    minPriceCents: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce
        .number()
        .int()
        .min(0, 'Minimum price must be non-negative')
        .optional(),
    ),
    maxPriceCents: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce
        .number()
        .int()
        .min(0, 'Maximum price must be non-negative')
        .optional(),
    ),
    page: z.coerce.number().int().positive().default(1),
    limit: paginationLimit(8, 100),
    sort: MealSortSchema.optional(),
  })
  .strict()
  .refine(
    (query) =>
      query.minPriceCents === undefined ||
      query.maxPriceCents === undefined ||
      query.minPriceCents <= query.maxPriceCents,
    {
      message: 'Minimum price cannot be greater than maximum price',
      path: ['minPriceCents'],
    },
  );

export const MealPayloadSchema = z
  .object({
    name: z.string().trim().min(1, 'Meal name is required'),
    description: z.string().trim().optional(),
    priceCents: z.coerce
      .number()
      .int('Meal priceCents must be an integer')
      .min(0, 'Meal priceCents must be non-negative'),
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
