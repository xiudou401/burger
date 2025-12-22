import express from 'express';
import { getMeals } from '../controllers/cartControllers';

const router = express.Router();

router.get('/', getMeals);

export default router;
