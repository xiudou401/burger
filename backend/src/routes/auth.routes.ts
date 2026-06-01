import express from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  forgotPasswordHandler,
  refreshHandler,
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
import { validateBody } from '../middleware/validate';
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SendSmsCodeSchema,
  SignupSchema,
  VerifyEmailSchema,
  VerifySmsCodeSchema,
} from '../validation/auth.schema';

const router = express.Router();

router.post('/signup', validateBody(SignupSchema, 'Signup payload'), signupHandler);
router.post('/login', validateBody(LoginSchema, 'Login payload'), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.post(
  '/verify-email',
  validateBody(VerifyEmailSchema, 'Verify email payload'),
  verifyEmailHandler,
);
router.post('/resend-verification', authenticate, resendVerificationHandler);
router.post(
  '/forgot-password',
  validateBody(ForgotPasswordSchema, 'Forgot password payload'),
  forgotPasswordHandler,
);
router.post(
  '/reset-password',
  validateBody(ResetPasswordSchema, 'Reset password payload'),
  resetPasswordHandler,
);
router.post(
  '/sms/send',
  optionalAuthenticate,
  validateBody(SendSmsCodeSchema, 'Send SMS code payload'),
  sendSmsCodeHandler,
);
router.post(
  '/sms/verify',
  validateBody(VerifySmsCodeSchema, 'Verify SMS code payload'),
  verifySmsCodeHandler,
);
router.get('/oauth/:provider/callback', oauthCallbackHandler);
router.get('/oauth/:provider', oauthStartHandler);

export default router;
