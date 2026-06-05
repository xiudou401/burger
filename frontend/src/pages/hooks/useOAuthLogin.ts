type OAuthMode = 'login' | 'signup' | 'admin';
type OAuthProvider = 'google' | 'apple';

const API_ORIGIN = process.env.REACT_APP_API_URL ?? 'http://localhost:5001';

export const useOAuthLogin = (mode: OAuthMode) => {
  const oauthLogin = (provider: OAuthProvider) => {
    window.location.assign(
      `${API_ORIGIN}/api/auth/oauth/${provider}?mode=${mode}`,
    );
  };

  return {
    oauthLogin,
  };
};
