import { Link, useSearchParams } from 'react-router-dom';
import {
  AuthHeader,
  AuthStatus,
  AuthSubmitButton,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useVerifyEmailToken } from './hooks/useVerifyEmailToken';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailDelivery = searchParams.get('emailDelivery');
  const { canResend, isResending, message, resendVerification, tone } =
    useVerifyEmailToken(token, emailDelivery);

  return (
    <AuthCenteredPage>
      <AuthHeader
        title="Email verification"
        subtitle="Your account security matters before checkout."
      />

      <AuthStatus tone={tone}>{message}</AuthStatus>

      {canResend && (
        <AuthSubmitButton
          type="button"
          disabled={isResending}
          onClick={resendVerification}
        >
          {isResending ? 'Sending...' : 'Resend verification email'}
        </AuthSubmitButton>
      )}

      <AuthSwitch>
        Continue to <Link to="/">menu</Link>
      </AuthSwitch>
    </AuthCenteredPage>
  );
};

export default VerifyEmail;
