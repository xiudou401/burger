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
  authActionRateLimiter,
  authAttemptRateLimiter,
} from '../middleware/security';
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

router.post(
  '/signup',
  authActionRateLimiter,
  validateBody(SignupSchema, 'Signup payload'),
  signupHandler,
);
router.post(
  '/login',
  authAttemptRateLimiter,
  validateBody(LoginSchema, 'Login payload'),
  loginHandler,
);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.post(
  '/verify-email',
  authAttemptRateLimiter,
  validateBody(VerifyEmailSchema, 'Verify email payload'),
  verifyEmailHandler,
);
router.post(
  '/resend-verification',
  authActionRateLimiter,
  authenticate,
  resendVerificationHandler,
);
router.post(
  '/forgot-password',
  authActionRateLimiter,
  validateBody(ForgotPasswordSchema, 'Forgot password payload'),
  forgotPasswordHandler,
);
router.post(
  '/reset-password',
  authAttemptRateLimiter,
  validateBody(ResetPasswordSchema, 'Reset password payload'),
  resetPasswordHandler,
);
router.post(
  '/sms/send',
  authActionRateLimiter,
  optionalAuthenticate,
  validateBody(SendSmsCodeSchema, 'Send SMS code payload'),
  sendSmsCodeHandler,
);
router.post(
  '/sms/verify',
  authAttemptRateLimiter,
  validateBody(VerifySmsCodeSchema, 'Verify SMS code payload'),
  verifySmsCodeHandler,
);
router.get('/oauth/:provider/callback', oauthCallbackHandler);
router.get('/oauth/:provider', oauthStartHandler);

export default router;
