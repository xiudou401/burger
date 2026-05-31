import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().trim().min(1, 'Meal id is required'),
  quantity: z.number().int('Quantity must be an integer').positive(),
});

export const CartPayloadSchema = z
  .object({
    items: z.array(CartItemSchema),
    menuVersion: z.number().int('Menu version must be an integer'),
  })
  .strict();

export type CartPayload = z.infer<typeof CartPayloadSchema>;
