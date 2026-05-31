import express from 'express';
import {
  createOrderHandler,
  getAdminOrderHandler,
  getMyOrderHandler,
  listAdminOrdersHandler,
  listMyOrdersHandler,
  updateOrderStatusHandler,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validate';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
} from '../validation/order.schema';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validateBody(CreateOrderSchema, 'Create order payload'),
  createOrderHandler,
);
router.get('/me', listMyOrdersHandler);
router.get('/admin/all', requireAdmin, listAdminOrdersHandler);
router.get('/admin/:orderId', requireAdmin, getAdminOrderHandler);
router.patch(
  '/:orderId/status',
  requireAdmin,
  validateBody(UpdateOrderStatusSchema, 'Update order status payload'),
  updateOrderStatusHandler,
);
router.get('/:orderId', getMyOrderHandler);

export default router;
