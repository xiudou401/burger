import express from 'express';
import {
  createMenuItemHandler,
  deleteMenuItemHandler,
  getMenuItems,
  updateMenuItemHandler,
} from '../controllers/menu-item.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdminRole } from '../middleware/requireAdmin';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate';
import {
  MenuItemParamsSchema,
  MenuItemPayloadSchema,
  MenuItemQuerySchema,
} from '../validation/menu-item.schema';

const router = express.Router();

router.get(
  '/',
  validateQuery(MenuItemQuerySchema, 'Menu item query'),
  getMenuItems,
);
router.post(
  '/',
  authenticate,
  requireAdminRole,
  validateBody(MenuItemPayloadSchema, 'Menu item payload'),
  createMenuItemHandler,
);
router.patch(
  '/:menuItemId',
  authenticate,
  requireAdminRole,
  validateParams(MenuItemParamsSchema, 'Menu item params'),
  validateBody(MenuItemPayloadSchema, 'Menu item payload'),
  updateMenuItemHandler,
);
router.delete(
  '/:menuItemId',
  authenticate,
  requireAdminRole,
  validateParams(MenuItemParamsSchema, 'Menu item params'),
  deleteMenuItemHandler,
);

export default router;
