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
import { useLoginPage } from './hooks/useLoginPage';
import { useOAuthLogin } from './hooks/useOAuthLogin';
import { useSmsLoginPage } from './hooks/useSmsLoginPage';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [loginMethod, setLoginMethod] = useState('email');
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    submit,
  } = useLoginPage();
  const smsLogin = useSmsLoginPage();
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

        <AuthTabs
          value={loginMethod}
          options={[
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
          ]}
          onChange={setLoginMethod}
        />

        {loginMethod === 'email' ? (
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
              <Link to="/forgot-password">Forgot password?</Link>
            </AuthTextLink>
            {error && <AuthStatus tone="error">{error}</AuthStatus>}
            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </AuthSubmitButton>
          </AuthFormElement>
        ) : (
          <AuthFormElement onSubmit={smsLogin.submit}>
            <AuthField
              label="Phone"
              inputProps={{
                value: smsLogin.phone,
                onChange: (event) => smsLogin.setPhone(event.target.value),
                type: 'tel',
                autoComplete: 'tel',
                placeholder: '+61412345678',
                required: true,
              }}
            />
            <AuthSubmitButton
              type="button"
              disabled={smsLogin.isSending || !smsLogin.phone}
              onClick={smsLogin.sendCode}
            >
              {smsLogin.isSending ? 'Sending code...' : 'Send SMS code'}
            </AuthSubmitButton>
            <AuthField
              label="SMS code"
              inputProps={{
                value: smsLogin.code,
                onChange: (event) => smsLogin.setCode(event.target.value),
                type: 'text',
                inputMode: 'numeric',
                autoComplete: 'one-time-code',
                maxLength: 6,
                required: true,
              }}
            />
            {smsLogin.message && (
              <AuthStatus tone="success">
                {smsLogin.devSmsCode
                  ? `${smsLogin.message}. Dev code: ${smsLogin.devSmsCode}`
                  : smsLogin.message}
              </AuthStatus>
            )}
            {smsLogin.error && (
              <AuthStatus tone="error">{smsLogin.error}</AuthStatus>
            )}
            <AuthSubmitButton disabled={smsLogin.isVerifying}>
              {smsLogin.isVerifying ? 'Verifying...' : 'Log in with phone'}
            </AuthSubmitButton>
          </AuthFormElement>
        )}

        <AuthSwitch>
          New here? <Link to="/signup">Create an account</Link>
        </AuthSwitch>
      </AuthCard>
    </AuthSplitPage>
  );
};

export default Login;
