import express from 'express';
import { generateAdminInsightsHandler } from '../controllers/admin-insight.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { validateBody } from '../middleware/validate';
import { AdminInsightRequestSchema } from '../validation/admin-insight.schema';

const router = express.Router();

router.use(authenticate, requirePermission('view_orders'));

router.post(
  '/generate',
  validateBody(AdminInsightRequestSchema, 'Admin insight request'),
  generateAdminInsightsHandler,
);

export default router;
