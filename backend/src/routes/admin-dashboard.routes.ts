import express from 'express';
import {
  getAdminAnalyticsSummaryHandler,
  getAdminDashboardSummaryHandler,
} from '../controllers/admin-dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { validateQuery } from '../middleware/validate';
import { AdminAnalyticsQuerySchema } from '../validation/admin-dashboard.schema';

const router = express.Router();

router.use(authenticate, requirePermission('view_orders'));

router.get('/summary', getAdminDashboardSummaryHandler);
router.get(
  '/analytics',
  validateQuery(AdminAnalyticsQuerySchema, 'Admin analytics query'),
  getAdminAnalyticsSummaryHandler,
);

export default router;
