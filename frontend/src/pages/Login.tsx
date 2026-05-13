import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api/auth';
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
import { useAuth } from '../store/auth/hooks/useAuth';

const API_ORIGIN = process.env.REACT_APP_API_URL ?? 'http://localhost:5001';

interface LoginLocationState {
  from?: {
    pathname: string;
    search?: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const loginFn = useAuth((ctx) => ctx.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);

      loginFn(res.accessToken, res.user);

      const state = location.state as LoginLocationState | null;
      const from = state?.from;
      const redirectTo = `${from?.pathname ?? '/'}${from?.search ?? ''}`;

      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const oauthLogin = (provider: 'google' | 'apple') => {
    window.location.assign(`${API_ORIGIN}/api/auth/oauth/${provider}?mode=login`);
  };

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
