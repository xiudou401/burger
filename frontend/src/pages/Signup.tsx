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
import {
  PASSWORD_INPUT_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
} from '../utils/password-policy';
import { useOAuthLogin } from './hooks/useOAuthLogin';
import { useSignupPage } from './hooks/useSignupPage';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isSubmitting,
    submit,
  } = useSignupPage();
  const { oauthLogin } = useOAuthLogin('signup');

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
          onGoogle={() => oauthLogin('google')}
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
              minLength: PASSWORD_MIN_LENGTH,
              pattern: PASSWORD_INPUT_PATTERN,
              title: PASSWORD_POLICY_MESSAGE,
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
              minLength: PASSWORD_MIN_LENGTH,
              pattern: PASSWORD_INPUT_PATTERN,
              title: PASSWORD_POLICY_MESSAGE,
              required: true,
            }}
          />
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
