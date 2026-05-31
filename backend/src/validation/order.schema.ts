import { z } from 'zod';
import { CartPayloadSchema } from './cart.schema';
import { ObjectIdSchema, paginationLimit } from './common.schema';

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

export const ListMyOrdersQuerySchema = z
  .object({
    limit: paginationLimit(5, 20),
  })
  .strict();

export const ListAdminOrdersQuerySchema = z
  .object({
    limit: paginationLimit(25, 100),
  })
  .strict();

export const OrderParamsSchema = z
  .object({
    orderId: ObjectIdSchema,
  })
  .strict();

export type CreateOrderPayload = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusPayload = z.infer<typeof UpdateOrderStatusSchema>;
export type ListOrdersQueryPayload = z.infer<typeof ListMyOrdersQuerySchema>;
export type OrderParamsPayload = z.infer<typeof OrderParamsSchema>;
