import express from 'express';
import {
  disableCustomerHandler,
  enableCustomerHandler,
  listCustomersHandler,
} from '../controllers/admin-customer.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdminRole } from '../middleware/requireAdmin';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate';
import {
  AdminCustomerParamsSchema,
  AdminCustomerQuerySchema,
  DisableCustomerSchema,
} from '../validation/admin-customer.schema';

const router = express.Router();

router.use(authenticate, requireAdminRole);

router.get(
  '/',
  validateQuery(AdminCustomerQuerySchema, 'Admin customer query'),
  listCustomersHandler,
);
router.post(
  '/:customerId/disable',
  validateParams(AdminCustomerParamsSchema, 'Admin customer params'),
  validateBody(DisableCustomerSchema, 'Disable customer payload'),
  disableCustomerHandler,
);
router.post(
  '/:customerId/enable',
  validateParams(AdminCustomerParamsSchema, 'Admin customer params'),
  enableCustomerHandler,
);

export default router;
