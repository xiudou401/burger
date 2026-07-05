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
import { requireAdmin } from '../middleware/requireAdmin';
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
  requireVerifiedContact,
  validateBody(CreateOrderSchema, 'Checkout order payload'),
  createCheckoutOrderHandler,
);
router.get(
  '/me',
  validateQuery(ListMyOrdersQuerySchema, 'List my orders query'),
  listMyOrdersHandler,
);
router.get(
  '/admin/all',
  requireAdmin,
  validateQuery(ListAdminOrdersQuerySchema, 'List admin orders query'),
  listAdminOrdersHandler,
);
router.get(
  '/admin/:orderId',
  requireAdmin,
  validateParams(OrderParamsSchema, 'Order params'),
  getAdminOrderHandler,
);
router.patch(
  '/:orderId/status',
  requireAdmin,
  validateParams(OrderParamsSchema, 'Order params'),
  validateBody(UpdateOrderStatusSchema, 'Update order status payload'),
  updateOrderStatusHandler,
);
router.get(
  '/:orderId',
  validateParams(OrderParamsSchema, 'Order params'),
  getMyOrderHandler,
);

export default router;
