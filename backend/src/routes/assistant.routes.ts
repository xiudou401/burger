import express from 'express';
import { chatWithAssistantHandler } from '../controllers/assistant.controller';
import { assistantRateLimiter } from '../middleware/security';
import { validateBody } from '../middleware/validate';
import { AssistantChatRequestSchema } from '../validation/assistant.schema';

const router = express.Router();

router.post(
  '/chat',
  assistantRateLimiter,
  validateBody(AssistantChatRequestSchema, 'Assistant chat payload'),
  chatWithAssistantHandler,
);

export default router;
