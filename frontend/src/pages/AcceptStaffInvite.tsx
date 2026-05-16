import { Link } from 'react-router-dom';
import {
  AuthCard,
  AuthHeader,
  AuthSocialButtons,
  AuthStatus,
  AuthSubmitButton,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthSplitPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useOAuthLogin } from './hooks/useOAuthLogin';
import { useAcceptStaffInvitePage } from './hooks/useAcceptStaffInvitePage';

const AcceptStaffInvite = () => {
  const {
    token,
    isAuthenticated,
    isAccepting,
    message,
    error,
    accept,
  } = useAcceptStaffInvitePage();
  const { oauthLogin } = useOAuthLogin('login');

  const signInWithGoogle = () => {
    if (token) {
      localStorage.setItem('pendingStaffInviteToken', token);
    }

    oauthLogin('google');
  };

  return (
    <AuthSplitPage
      title="Join the kitchen console."
      subtitle="Accept your Burger Club staff invitation with the email address that received it."
      imageIds={[4, 6, 7]}
    >
      <AuthCard>
        <AuthHeader
          title="Accept invite"
          subtitle="Sign in first, then confirm the invitation."
        />

        {!isAuthenticated && (
          <AuthSocialButtons
            googleLabel="Continue with Google"
            appleLabel="Continue with Apple"
            onGoogle={signInWithGoogle}
            onApple={() => oauthLogin('apple')}
          />
        )}

        {isAuthenticated && (
          <AuthSubmitButton
            disabled={isAccepting}
            type="button"
            onClick={accept}
          >
            {isAccepting ? 'Accepting...' : 'Accept invitation'}
          </AuthSubmitButton>
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
