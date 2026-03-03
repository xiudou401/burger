import express from 'express';
import { validateCartHandler } from '../controllers/cart.controller';

const router = express.Router();

// POST /api/cart/validate
router.post('/validate', validateCartHandler);

export default router;
