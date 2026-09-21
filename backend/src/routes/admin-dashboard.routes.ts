import express from 'express';
import {
  getAdminAnalyticsAlertsHandler,
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
router.get(
  '/alerts',
  validateQuery(AdminAnalyticsQuerySchema, 'Admin analytics alerts query'),
  getAdminAnalyticsAlertsHandler,
);

export default router;
