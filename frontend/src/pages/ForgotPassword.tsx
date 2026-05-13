import { Link } from 'react-router-dom';
import {
  AuthField,
  AuthFormElement,
  AuthHeader,
  AuthStatus,
  AuthSubmitButton,
  AuthSwitch,
  AuthTextLink,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useForgotPasswordPage } from './hooks/useForgotPasswordPage';

const ForgotPassword = () => {
  const {
    email,
    setEmail,
    message,
    devResetToken,
    error,
    isSubmitting,
    submit,
  } = useForgotPasswordPage();

  return (
    <AuthCenteredPage>
      <AuthHeader
        title="Reset password"
        subtitle="Enter your email and we will send a reset link."
      />

      <AuthFormElement onSubmit={submit}>
        <AuthField
          label="Email"
          inputProps={{
            value: email,
            onChange: (event) => setEmail(event.target.value),
            type: 'email',
            autoComplete: 'email',
            required: true,
          }}
        />
        {message && <AuthStatus tone="success">{message}</AuthStatus>}
        {devResetToken && (
          <AuthTextLink>
            <Link to={`/reset-password?token=${devResetToken}`}>
              Open local reset link
            </Link>
          </AuthTextLink>
        )}
        {error && <AuthStatus tone="error">{error}</AuthStatus>}
        <AuthSubmitButton disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </AuthSubmitButton>
      </AuthFormElement>

      <AuthSwitch>
        Remembered it? <Link to="/login">Log in</Link>
      </AuthSwitch>
    </AuthCenteredPage>
  );
};

export default ForgotPassword;
