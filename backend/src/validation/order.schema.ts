import { z } from 'zod';
import { CartPayloadSchema } from './cart.schema';

export const CreateOrderSchema = CartPayloadSchema;

export const OrderStatusSchema = z.enum([
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]);

export const UpdateOrderStatusSchema = z
  .object({
    status: OrderStatusSchema,
  })
  .strict();

export type CreateOrderPayload = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusPayload = z.infer<typeof UpdateOrderStatusSchema>;
