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
  AuthTextLink,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthSplitPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useLoginPage } from './hooks/useLoginPage';
import { useOAuthLogin } from './hooks/useOAuthLogin';

const Login = () => {
  const [searchParams] = useSearchParams();
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    submit,
  } = useLoginPage();
  const { oauthLogin } = useOAuthLogin('login');

  return (
    <AuthSplitPage
      title="Welcome back to big flavor."
      subtitle="Sign in to keep your favorites, cart, and checkout ready for your next order."
      imageIds={[1, 2, 3]}
    >
      <AuthCard>
        <AuthHeader
          title="Log in"
          subtitle="Use your email and password to continue ordering."
        />

        {searchParams.get('error') && (
          <AuthStatus tone="error">{searchParams.get('error')}</AuthStatus>
        )}

        <AuthSocialButtons
          googleLabel="Continue with Google"
          appleLabel="Continue with Apple"
          onGoogle={() => oauthLogin('google')}
          onApple={() => oauthLogin('apple')}
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
          <AuthTextLink align="end">
            <Link to="/forgot-password">
              Forgot password?
            </Link>
          </AuthTextLink>
          {error && <AuthStatus tone="error">{error}</AuthStatus>}
          <AuthSubmitButton disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </AuthSubmitButton>
        </AuthFormElement>

        <AuthSwitch>
          New here? <Link to="/signup">Create an account</Link>
        </AuthSwitch>
      </AuthCard>
    </AuthSplitPage>
  );
};

export default Login;
