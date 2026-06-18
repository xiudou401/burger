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
  resendVerificationRateLimiter,
  verifyTrustedOrigin,
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
  verifyTrustedOrigin,
  authActionRateLimiter,
  validateBody(SignupSchema, 'Signup payload'),
  signupHandler,
);
router.post(
  '/login',
  verifyTrustedOrigin,
  authAttemptRateLimiter,
  validateBody(LoginSchema, 'Login payload'),
  loginHandler,
);
router.post('/refresh', verifyTrustedOrigin, refreshHandler);
router.post('/logout', verifyTrustedOrigin, logoutHandler);
router.get('/me', authenticate, meHandler);
router.post(
  '/verify-email',
  verifyTrustedOrigin,
  authAttemptRateLimiter,
  validateBody(VerifyEmailSchema, 'Verify email payload'),
  verifyEmailHandler,
);
router.post(
  '/resend-verification',
  verifyTrustedOrigin,
  authActionRateLimiter,
  authenticate,
  resendVerificationRateLimiter,
  resendVerificationHandler,
);
router.post(
  '/forgot-password',
  verifyTrustedOrigin,
  authActionRateLimiter,
  validateBody(ForgotPasswordSchema, 'Forgot password payload'),
  forgotPasswordHandler,
);
router.post(
  '/reset-password',
  verifyTrustedOrigin,
  authAttemptRateLimiter,
  validateBody(ResetPasswordSchema, 'Reset password payload'),
  resetPasswordHandler,
);
router.post(
  '/sms/send',
  verifyTrustedOrigin,
  authActionRateLimiter,
  optionalAuthenticate,
  validateBody(SendSmsCodeSchema, 'Send SMS code payload'),
  sendSmsCodeHandler,
);
router.post(
  '/sms/verify',
  verifyTrustedOrigin,
  authAttemptRateLimiter,
  validateBody(VerifySmsCodeSchema, 'Verify SMS code payload'),
  verifySmsCodeHandler,
);
router.get('/oauth/:provider/callback', oauthCallbackHandler);
router.get('/oauth/:provider', oauthStartHandler);

export default router;
