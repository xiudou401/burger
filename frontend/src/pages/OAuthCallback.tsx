import { Link } from 'react-router-dom';
import {
  AuthHeader,
  AuthStatus,
  AuthSwitch,
} from '../components/Auth/AuthForm/AuthForm';
import { AuthCenteredPage } from '../components/Auth/AuthLayout/AuthLayout';
import { useOAuthCallback } from './hooks/useOAuthCallback';

const OAuthCallback = () => {
  const { error } = useOAuthCallback();

  return (
    <AuthCenteredPage>
      <AuthHeader title="Signing you in" subtitle="Finishing your secure sign in." />

      {error ? (
        <>
          <AuthStatus tone="error">{error}</AuthStatus>
          <AuthSwitch>
            Back to <Link to="/login">log in</Link>
          </AuthSwitch>
        </>
      ) : (
        <AuthStatus tone="success">Almost there...</AuthStatus>
      )}
    </AuthCenteredPage>
  );
};

export default OAuthCallback;
