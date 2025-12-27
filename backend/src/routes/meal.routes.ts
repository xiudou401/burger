import express from 'express';
import { getMeals } from '../controllers/meal.controller';

const router = express.Router();

router.get('/', getMeals);

export default router;
