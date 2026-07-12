import express from 'express';
import { listAuditLogsHandler } from '../controllers/audit-log.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { validateQuery } from '../middleware/validate';
import { ListAuditLogsQuerySchema } from '../validation/audit-log.schema';

const router = express.Router();

router.use(authenticate, requirePermission('view_audit_logs'));

router.get(
  '/',
  validateQuery(ListAuditLogsQuerySchema, 'List audit logs query'),
  listAuditLogsHandler,
);

export default router;
