import { useContextSelector } from 'use-context-selector';
import { AuthContext, AuthContextValue } from '../auth-context';

export const useAuth = <T>(selector: (ctx: AuthContextValue) => T) => {
  return useContextSelector(AuthContext, (ctx) => {
    if (!ctx) {
      throw new Error('useAuth must be used inside AuthProvider');
    }

    return selector(ctx);
  });
};
