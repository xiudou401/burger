import express from 'express';
import {
  acceptStaffInviteHandler,
  createStaffInviteHandler,
  listStaffInvitesHandler,
  revokeStaffInviteHandler,
} from '../controllers/staff-invite.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdminRole } from '../middleware/requireAdmin';

const router = express.Router();

router.post('/accept', authenticate, acceptStaffInviteHandler);

router.use(authenticate, requireAdminRole);

router.get('/', listStaffInvitesHandler);
router.post('/', createStaffInviteHandler);
router.post('/:inviteId/revoke', revokeStaffInviteHandler);

export default router;
