import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setDevResetToken(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      setDevResetToken(res.resetToken ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
