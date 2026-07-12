import express from 'express';
import {
  acceptStaffInviteHandler,
  createStaffInviteHandler,
  listStaffInvitesHandler,
  revokeStaffInviteHandler,
} from '../controllers/staff-invite.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { validateBody, validateParams } from '../middleware/validate';
import {
  AcceptStaffInviteSchema,
  CreateStaffInviteSchema,
  StaffInviteParamsSchema,
} from '../validation/staff-invite.schema';

const router = express.Router();

router.post(
  '/accept',
  authenticate,
  validateBody(AcceptStaffInviteSchema, 'Accept staff invite payload'),
  acceptStaffInviteHandler,
);

router.use(authenticate, requirePermission('manage_staff'));

router.get('/', listStaffInvitesHandler);
router.post(
  '/',
  validateBody(CreateStaffInviteSchema, 'Create staff invite payload'),
  createStaffInviteHandler,
);
router.post(
  '/:inviteId/revoke',
  validateParams(StaffInviteParamsSchema, 'Staff invite params'),
  revokeStaffInviteHandler,
);

export default router;
