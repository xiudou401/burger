import express from 'express';
import {
  loginHandler,
  meHandler,
  signupHandler,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.get('/me', authenticate, meHandler);

export default router;
