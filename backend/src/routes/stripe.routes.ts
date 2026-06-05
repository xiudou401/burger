import express from 'express';
import { stripeWebhookHandler } from '../controllers/stripe.controller';

const router = express.Router();

router.post('/webhook', stripeWebhookHandler);

export default router;
