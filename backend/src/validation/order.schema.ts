import { z } from 'zod';
import { CartPayloadSchema } from './cart.schema';
import { ObjectIdSchema, paginationLimit } from './common.schema';

export const CreateOrderSchema = CartPayloadSchema.extend({
  idempotencyKey: z.string().trim().uuid('Invalid checkout attempt'),
}).strict();

export const OrderStatusSchema = z.enum([
  'pending_payment',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]);

export const CancellationReasonSchema = z.enum([
  'payment_failed',
  'customer_abandoned_checkout',
  'staff_cancelled',
  'item_unavailable',
  'duplicate_order',
  'other',
]);

export const UpdateOrderStatusSchema = z
  .object({
    status: OrderStatusSchema,
    version: z.number().int().nonnegative(),
    cancellationReason: CancellationReasonSchema.optional(),
  })
  .strict()
  .refine(
    (payload) =>
      payload.status !== 'cancelled' ||
      payload.cancellationReason !== undefined,
    {
      message: 'Cancellation reason is required when cancelling an order',
      path: ['cancellationReason'],
    },
  );

export const ListMyOrdersQuerySchema = z
  .object({
    limit: paginationLimit(5, 20),
  })
  .strict();

export const ListAdminOrdersQuerySchema = z
  .object({
    limit: paginationLimit(20, 100),
    cursor: z.string().trim().max(200).optional(),
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
export type ListAdminOrdersQueryPayload = z.infer<
  typeof ListAdminOrdersQuerySchema
>;
export type OrderParamsPayload = z.infer<typeof OrderParamsSchema>;
