import express from 'express';
import {
  createCheckoutOrderHandler,
  getAdminOrderHandler,
  getMyOrderHandler,
  listAdminOrdersHandler,
  listMyOrdersHandler,
  updateOrderStatusHandler,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { requireVerifiedContact } from '../middleware/requireVerifiedContact';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate';
import {
  CreateOrderSchema,
  ListAdminOrdersQuerySchema,
  ListMyOrdersQuerySchema,
  OrderParamsSchema,
  UpdateOrderStatusSchema,
} from '../validation/order.schema';

const router = express.Router();

router.use(authenticate);

router.post(
  '/checkout',
  requirePermission('create_order'),
  requireVerifiedContact,
  validateBody(CreateOrderSchema, 'Checkout order payload'),
  createCheckoutOrderHandler,
);
router.get(
  '/me',
  requirePermission('view_own_orders'),
  validateQuery(ListMyOrdersQuerySchema, 'List my orders query'),
  listMyOrdersHandler,
);
router.get(
  '/admin/all',
  requirePermission('view_orders'),
  validateQuery(ListAdminOrdersQuerySchema, 'List admin orders query'),
  listAdminOrdersHandler,
);
router.get(
  '/admin/:orderId',
  requirePermission('view_orders'),
  validateParams(OrderParamsSchema, 'Order params'),
  getAdminOrderHandler,
);
router.patch(
  '/:orderId/status',
  requirePermission('update_order_status'),
  validateParams(OrderParamsSchema, 'Order params'),
  validateBody(UpdateOrderStatusSchema, 'Update order status payload'),
  updateOrderStatusHandler,
);
router.get(
  '/:orderId',
  requirePermission('view_own_orders'),
  validateParams(OrderParamsSchema, 'Order params'),
  getMyOrderHandler,
);

export default router;
