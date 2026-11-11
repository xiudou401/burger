import { z } from 'zod';
import { CartPayloadSchema } from './cart.schema';
import { ObjectIdSchema, paginationLimit } from './common.schema';

export const CreateOrderSchema = CartPayloadSchema.extend({
  idempotencyKey: z.string().trim().uuid('Invalid checkout attempt'),
  supersededCheckoutKeys: z.array(z.string().uuid()).max(20).optional(),
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
    search: z
      .string()
      .trim()
      .transform((value) => value.replace(/^#/, '').toLowerCase())
      .pipe(
        z
          .string()
          .regex(
            /^(?:[a-f0-9]{6}|[a-f0-9]{24})$/,
            'Enter a 6-character or full 24-character order number',
          ),
      )
      .optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    limit: paginationLimit(20, 100),
    cursor: z.string().trim().max(200).optional(),
    view: z
      .enum([
        'all',
        'kitchen',
        'awaiting_payment',
        'past',
        'completed',
        'cancelled',
      ])
      .default('all'),
  })
  .strict()
  .refine(
    (value) =>
      !value.from || !value.to || new Date(value.from) < new Date(value.to),
    'The date range must end after it starts',
  )
  .refine(
    (value) => value.view !== 'kitchen' || (!value.from && !value.to),
    'Kitchen orders cannot be hidden by a date filter',
  );

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
