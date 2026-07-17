import { Link } from 'react-router-dom';
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
import { useOAuthLogin } from './hooks/useOAuthLogin';
import { useAcceptStaffInvitePage } from './hooks/useAcceptStaffInvitePage';

const PENDING_STAFF_INVITE_TOKEN = 'pendingStaffInviteToken';

const AcceptStaffInvite = () => {
  const {
    token,
    isAuthenticated,
    email,
    setEmail,
    password,
    setPassword,
    isSigningIn,
    signInError,
    isAccepting,
    message,
    error,
    submitSignIn,
    accept,
  } = useAcceptStaffInvitePage();
  const { oauthLogin } = useOAuthLogin('login');

  const signInWithGoogle = () => {
    if (token) {
      sessionStorage.setItem(PENDING_STAFF_INVITE_TOKEN, token);
    }

    oauthLogin('google');
  };

  return (
    <AuthSplitPage
      title="Join the kitchen console."
      subtitle="Accept your Sydney Burger staff invitation with the email address that received it."
    >
      <AuthCard>
        <AuthHeader
          title="Accept invite"
          subtitle="Sign in first, then confirm the invitation."
        />

        {!isAuthenticated && token && (
          <>
            <AuthSocialButtons
              googleLabel="Continue with Google"
              onGoogle={signInWithGoogle}
            />

            <AuthFormElement onSubmit={submitSignIn}>
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
              {signInError && (
                <AuthStatus tone="error">{signInError}</AuthStatus>
              )}
              <AuthSubmitButton disabled={isSigningIn}>
                {isSigningIn ? 'Signing in...' : 'Sign in to continue'}
              </AuthSubmitButton>
            </AuthFormElement>
          </>
        )}

        {isAuthenticated && token && (
          <AuthSubmitButton
            disabled={isAccepting}
            type="button"
            onClick={accept}
          >
            {isAccepting ? 'Accepting...' : 'Accept invitation'}
          </AuthSubmitButton>
        )}

        {isAuthenticated && !token && (
          <AuthStatus tone="error">
            This invitation link is missing a token.
          </AuthStatus>
        )}

        {message && <AuthStatus tone="success">{message}</AuthStatus>}
        {error && <AuthStatus tone="error">{error}</AuthStatus>}

        <AuthSwitch>
          Already staff? <Link to="/admin/login">Go to admin login</Link>
        </AuthSwitch>
      </AuthCard>
    </AuthSplitPage>
  );
};

export default AcceptStaffInvite;
