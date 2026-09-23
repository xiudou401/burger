import express from 'express';
import { createMenuImageUploadHandler } from '../controllers/upload.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { validateBody } from '../middleware/validate';
import { MenuImageUploadSchema } from '../validation/upload.schema';

const router = express.Router();

router.post(
  '/menu-image',
  authenticate,
  requirePermission('manage_menu'),
  validateBody(MenuImageUploadSchema, 'Menu image upload payload'),
  createMenuImageUploadHandler,
);

export default router;
