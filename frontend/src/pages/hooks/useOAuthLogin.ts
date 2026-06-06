type OAuthMode = 'login' | 'signup' | 'admin';
type OAuthProvider = 'google' | 'apple';

export const useOAuthLogin = (mode: OAuthMode) => {
  const oauthLogin = (provider: OAuthProvider) => {
    window.location.assign(`/api/auth/oauth/${provider}?mode=${mode}`);
  };

  return {
    oauthLogin,
  };
};
