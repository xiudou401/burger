import { API_BASE } from '../../api/api-base';

type OAuthMode = 'login' | 'signup' | 'admin';
type OAuthProvider = 'google';

export const useOAuthLogin = (mode: OAuthMode) => {
  const oauthLogin = (provider: OAuthProvider) => {
    window.location.assign(`${API_BASE}/auth/oauth/${provider}?mode=${mode}`);
  };

  return {
    oauthLogin,
  };
};
