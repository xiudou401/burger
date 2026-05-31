import express from 'express';
import {
  createMealHandler,
  deleteMealHandler,
  getMeals,
  updateMealHandler,
} from '../controllers/meal.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdminRole } from '../middleware/requireAdmin';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate';
import {
  MealParamsSchema,
  MealPayloadSchema,
  MealQuerySchema,
} from '../validation/meal.schema';

const router = express.Router();

router.get('/', validateQuery(MealQuerySchema, 'Meal query'), getMeals);
router.post(
  '/',
  authenticate,
  requireAdminRole,
  validateBody(MealPayloadSchema, 'Meal payload'),
  createMealHandler,
);
router.patch(
  '/:mealId',
  authenticate,
  requireAdminRole,
  validateParams(MealParamsSchema, 'Meal params'),
  validateBody(MealPayloadSchema, 'Meal payload'),
  updateMealHandler,
);
router.delete(
  '/:mealId',
  authenticate,
  requireAdminRole,
  validateParams(MealParamsSchema, 'Meal params'),
  deleteMealHandler,
);

export default router;
