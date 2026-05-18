import express from 'express';
import {
  createMealHandler,
  deleteMealHandler,
  getMeals,
  updateMealHandler,
} from '../controllers/meal.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdminRole } from '../middleware/requireAdmin';

const router = express.Router();

router.get('/', getMeals);
router.post('/', authenticate, requireAdminRole, createMealHandler);
router.patch('/:mealId', authenticate, requireAdminRole, updateMealHandler);
router.delete('/:mealId', authenticate, requireAdminRole, deleteMealHandler);

export default router;
