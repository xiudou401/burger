import { Link, useSearchParams } from 'react-router-dom';
import {
  AuthHeader,
  AuthStatus,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useVerifyEmailToken } from './hooks/useVerifyEmailToken';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { message, isError } = useVerifyEmailToken(token);

  return (
    <AuthCenteredPage>
      <AuthHeader
        title="Email verification"
        subtitle="Your account security matters before checkout."
      />

      <AuthStatus tone={isError ? 'error' : 'success'}>{message}</AuthStatus>

      <AuthSwitch>
        Continue to <Link to="/">menu</Link>
      </AuthSwitch>
    </AuthCenteredPage>
  );
};

export default VerifyEmail;
