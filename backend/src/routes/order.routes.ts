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

const router = express.Router();

router.use(authenticate);

router.post('/', createOrderHandler);
router.get('/me', listMyOrdersHandler);
router.get('/admin/all', requireAdmin, listAdminOrdersHandler);
router.get('/admin/:orderId', requireAdmin, getAdminOrderHandler);
router.patch('/:orderId/status', requireAdmin, updateOrderStatusHandler);
router.get('/:orderId', getMyOrderHandler);

export default router;
