import express from 'express';
import {
  loginHandler,
  meHandler,
  forgotPasswordHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  sendSmsCodeHandler,
  signupHandler,
  verifyEmailHandler,
  verifySmsCodeHandler,
} from '../controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import {
  oauthCallbackHandler,
  oauthStartHandler,
} from '../controllers/oauth.controller';

const router = express.Router();

router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.get('/me', authenticate, meHandler);
router.post('/verify-email', verifyEmailHandler);
router.post('/resend-verification', authenticate, resendVerificationHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
router.post('/sms/send', optionalAuthenticate, sendSmsCodeHandler);
router.post('/sms/verify', verifySmsCodeHandler);
router.get('/oauth/:provider/callback', oauthCallbackHandler);
router.get('/oauth/:provider', oauthStartHandler);

export default router;
