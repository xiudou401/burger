import { z } from 'zod';
import { ObjectIdSchema } from './common.schema';

export const MAX_CART_ITEMS = 50;
export const MAX_CART_ITEM_QUANTITY = 20;

export const CartItemSchema = z
  .object({
    id: ObjectIdSchema,
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(
        MAX_CART_ITEM_QUANTITY,
        `Quantity cannot exceed ${MAX_CART_ITEM_QUANTITY}`,
      ),
  })
  .strict();

export const CartPayloadSchema = z
  .object({
    items: z
      .array(CartItemSchema)
      .min(1, 'Cart must contain at least one item')
      .max(
        MAX_CART_ITEMS,
        `Cart cannot contain more than ${MAX_CART_ITEMS} items`,
      )
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        'Cart cannot contain duplicate menu items',
      ),
    menuVersion: z
      .number()
      .int('Menu version must be an integer')
      .nonnegative('Menu version cannot be negative'),
  })
  .strict();

export type CartPayload = z.infer<typeof CartPayloadSchema>;
