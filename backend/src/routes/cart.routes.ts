import express from 'express';
import { validateCartHandler } from '../controllers/cart.controller';
import { validateBody } from '../middleware/validate';
import { CartPayloadSchema } from '../validation/cart.schema';

const router = express.Router();

// POST /api/cart/validate
router.post(
  '/validate',
  validateBody(CartPayloadSchema, 'Cart payload'),
  validateCartHandler,
);

export default router;
