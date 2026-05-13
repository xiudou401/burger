import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import {
  AuthField,
  AuthFormElement,
  AuthHeader,
  AuthStatus,
  AuthSubmitButton,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPassword(token, password);
      setMessage(res.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCenteredPage>
      <AuthHeader title="Choose new password" subtitle="Use at least 6 characters." />

      <AuthFormElement onSubmit={submit}>
        <AuthField
          label="New password"
          inputProps={{
            value: password,
            onChange: (event) => setPassword(event.target.value),
            type: 'password',
            autoComplete: 'new-password',
            minLength: 6,
            required: true,
          }}
        />
        <AuthField
          label="Confirm password"
          inputProps={{
            value: confirmPassword,
            onChange: (event) => setConfirmPassword(event.target.value),
            type: 'password',
            autoComplete: 'new-password',
            minLength: 6,
            required: true,
          }}
        />
        {message && <AuthStatus tone="success">{message}</AuthStatus>}
        {error && <AuthStatus tone="error">{error}</AuthStatus>}
        <AuthSubmitButton disabled={isSubmitting || !token}>
          {isSubmitting ? 'Saving...' : 'Save password'}
        </AuthSubmitButton>
      </AuthFormElement>

      <AuthSwitch>
        Back to <Link to="/login">log in</Link>
      </AuthSwitch>
    </AuthCenteredPage>
  );
};

export default ResetPassword;
