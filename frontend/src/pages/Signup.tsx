import { useState } from 'react';
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
  AuthTabs,
  AuthTextLink,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthSplitPage } from '../components/Auth/AuthLayout/AuthLayout';
import {
  PASSWORD_INPUT_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
} from '../utils/password-policy';
import { isSmsAuthEnabled } from '../config/features';
import { useOAuthLogin } from './hooks/useOAuthLogin';
import { useSignupPage } from './hooks/useSignupPage';
import { useSmsLoginPage } from './hooks/useSmsLoginPage';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [signupMethod, setSignupMethod] = useState('email');
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
    devVerificationToken,
    isSubmitting,
    submit,
  } = useSignupPage();
  const smsSignup = useSmsLoginPage({
    fallbackMessage: 'Phone signup failed',
  });
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

        {isSmsAuthEnabled && (
          <AuthTabs
            value={signupMethod}
            options={[
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
            ]}
            onChange={setSignupMethod}
          />
        )}

        {!isSmsAuthEnabled || signupMethod === 'email' ? (
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
        ) : (
          <AuthFormElement onSubmit={smsSignup.submit}>
            <AuthField
              label="Phone"
              inputProps={{
                value: smsSignup.phone,
                onChange: (event) => smsSignup.setPhone(event.target.value),
                type: 'tel',
                autoComplete: 'tel',
                placeholder: '+61412345678',
                required: true,
              }}
            />
            <AuthSubmitButton
              type="button"
              disabled={smsSignup.isSending || !smsSignup.phone}
              onClick={smsSignup.sendCode}
            >
              {smsSignup.isSending ? 'Sending code...' : 'Send SMS code'}
            </AuthSubmitButton>
            <AuthField
              label="SMS code"
              inputProps={{
                value: smsSignup.code,
                onChange: (event) => smsSignup.setCode(event.target.value),
                type: 'text',
                inputMode: 'numeric',
                autoComplete: 'one-time-code',
                maxLength: 6,
                required: true,
              }}
            />
            {smsSignup.message && (
              <AuthStatus tone="success">
                {smsSignup.devSmsCode
                  ? `${smsSignup.message}. Dev code: ${smsSignup.devSmsCode}`
                  : smsSignup.message}
              </AuthStatus>
            )}
            {smsSignup.error && (
              <AuthStatus tone="error">{smsSignup.error}</AuthStatus>
            )}
            <AuthSubmitButton disabled={smsSignup.isVerifying}>
              {smsSignup.isVerifying ? 'Verifying...' : 'Continue with phone'}
            </AuthSubmitButton>
          </AuthFormElement>
        )}

        <AuthSwitch>
          Already have an account? <Link to="/login">Log in</Link>
        </AuthSwitch>
      </AuthCard>
    </AuthSplitPage>
  );
};

export default Signup;
