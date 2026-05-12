import express from 'express';
import { validateCartHandler } from '../controllers/cart.controller';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

// POST /api/cart/validate
router.post('/validate', authenticate, validateCartHandler);

export default router;
