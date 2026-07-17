import { z } from 'zod';
import { MENU_ITEM_CATEGORIES } from '../models/menu-item.model';
import { ObjectIdSchema, paginationLimit } from './common.schema';

export const MenuItemSortSchema = z.enum([
  'price_asc',
  'price_desc',
  'created_asc',
  'created_desc',
]);

export const MenuItemQuerySchema = z
  .object({
    keyword: z
      .string()
      .trim()
      .max(50, 'Search keyword cannot exceed 50 characters')
      .optional(),
    category: z.enum(MENU_ITEM_CATEGORIES).optional(),
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
    sort: MenuItemSortSchema.optional(),
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

export const MenuItemPayloadSchema = z
  .object({
    name: z.string().trim().min(1, 'Menu item name is required'),
    description: z.string().trim().optional(),
    priceCents: z.coerce
      .number()
      .int('Menu item priceCents must be an integer')
      .min(0, 'Menu item priceCents must be non-negative'),
    image: z.string().trim().optional(),
    category: z.enum(MENU_ITEM_CATEGORIES).default('burger'),
    isAvailable: z.boolean().default(true),
  })
  .strict();

export const MenuItemParamsSchema = z
  .object({
    menuItemId: ObjectIdSchema,
  })
  .strict();

export type MenuItemQueryPayload = z.infer<typeof MenuItemQuerySchema>;
export type MenuItemPayload = z.infer<typeof MenuItemPayloadSchema>;
export type MenuItemParamsPayload = z.infer<typeof MenuItemParamsSchema>;
