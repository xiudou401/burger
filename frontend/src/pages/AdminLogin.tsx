import { Link, useSearchParams } from 'react-router-dom';
import {
  AuthCard,
  AuthField,
  AuthFormElement,
  AuthHeader,
  AuthSocialButtons,
  AuthStatus,
  AuthSubmitButton,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthSplitPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useAdminLoginPage } from './hooks/useAdminLoginPage';
import { useOAuthLogin } from './hooks/useOAuthLogin';

const AdminLogin = () => {
  const [searchParams] = useSearchParams();
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    submit,
  } = useAdminLoginPage();
  const { oauthLogin } = useOAuthLogin('admin');

  return (
    <AuthSplitPage
      title="Kitchen console."
      subtitle="Sign in with a staff account to manage live Sydney Burger orders."
      imageIds={[4, 5, 6]}
    >
      <AuthCard>
        <AuthHeader
          title="Admin login"
          subtitle="This area is for staff and administrators."
        />

        {searchParams.get('error') && (
          <AuthStatus tone="error">{searchParams.get('error')}</AuthStatus>
        )}

        <AuthSocialButtons
          googleLabel="Continue with Google"
          onGoogle={() => oauthLogin('google')}
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
          <AuthField
            label="Password"
            inputProps={{
              value: password,
              onChange: (event) => setPassword(event.target.value),
              type: 'password',
              autoComplete: 'current-password',
              required: true,
            }}
          />
          {error && <AuthStatus tone="error">{error}</AuthStatus>}
          <AuthSubmitButton disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </AuthSubmitButton>
        </AuthFormElement>

        <AuthSwitch>
          Customer? <Link to="/login">Go to customer login</Link>
        </AuthSwitch>
      </AuthCard>
    </AuthSplitPage>
  );
};

export default AdminLogin;
