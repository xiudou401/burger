import express from 'express';
import { getAdminDashboardSummaryHandler } from '../controllers/admin-dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';

const router = express.Router();

router.use(authenticate, requirePermission('view_orders'));

router.get('/summary', getAdminDashboardSummaryHandler);

export default router;
