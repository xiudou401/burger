import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signup } from '../api/auth';
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

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginFn = useAuth((ctx) => ctx.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [devVerificationToken, setDevVerificationToken] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDevVerificationToken(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await signup(name, email, password);

      loginFn(res.accessToken, res.user);

      if (res.emailVerificationToken) {
        navigate(`/verify-email?token=${res.emailVerificationToken}`);
        return;
      }

      setDevVerificationToken(null);
      navigate('/verify-email');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const oauthLogin = (provider: 'google' | 'apple') => {
    window.location.assign(`${API_ORIGIN}/api/auth/oauth/${provider}?mode=signup`);
  };

  return (
    <AuthSplitPage
      title="Join the crave-worthy side."
      subtitle="Create an account and your next burger run starts a little faster."
      imageIds={[4, 5, 6]}
    >
      <AuthCard>
        <AuthHeader
          title="Sign up"
          subtitle="Save your details and get back to the menu in seconds."
        />

        {searchParams.get('error') && (
          <AuthStatus tone="error">{searchParams.get('error')}</AuthStatus>
        )}

        <AuthSocialButtons
          googleLabel="Sign up with Google"
          appleLabel="Sign up with Apple"
          onGoogle={() => oauthLogin('google')}
          onApple={() => oauthLogin('apple')}
        />

        <AuthFormElement onSubmit={submit}>
          <AuthField
            label="Name"
            inputProps={{
              value: name,
              onChange: (event) => setName(event.target.value),
              type: 'text',
              autoComplete: 'name',
              required: true,
            }}
          />
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
          {devVerificationToken && (
            <AuthTextLink>
              <Link to={`/verify-email?token=${devVerificationToken}`}>
                Open local verification link
              </Link>
            </AuthTextLink>
          )}
          {error && <AuthStatus tone="error">{error}</AuthStatus>}
          <AuthSubmitButton disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </AuthSubmitButton>
        </AuthFormElement>

        <AuthSwitch>
          Already have an account? <Link to="/login">Log in</Link>
        </AuthSwitch>
      </AuthCard>
    </AuthSplitPage>
  );
};

export default Signup;
