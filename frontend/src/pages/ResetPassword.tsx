import { Link } from 'react-router-dom';
import {
  AuthField,
  AuthFormElement,
  AuthHeader,
  AuthStatus,
  AuthSubmitButton,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useResetPasswordPage } from './hooks/useResetPasswordPage';

const ResetPassword = () => {
  const {
    token,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    message,
    error,
    isSubmitting,
    submit,
  } = useResetPasswordPage();

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
