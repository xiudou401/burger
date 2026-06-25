import type { User } from '../types/auth';

const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';
const AUTH_SESSION_REFRESHED_EVENT = 'auth:session-refreshed';

interface RefreshedSession {
  accessToken: string;
  user: User;
}

export const notifyAuthSessionExpired = () => {
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
};

export const subscribeToAuthSessionExpired = (listener: () => void) => {
  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);

  return () => {
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
  };
};

export const notifyAuthSessionRefreshed = (session: RefreshedSession) => {
  window.dispatchEvent(
    new CustomEvent<RefreshedSession>(AUTH_SESSION_REFRESHED_EVENT, {
      detail: session,
    }),
  );
};

export const subscribeToAuthSessionRefreshed = (
  listener: (session: RefreshedSession) => void,
) => {
  const handleSessionRefreshed = (event: Event) => {
    listener((event as CustomEvent<RefreshedSession>).detail);
  };

  window.addEventListener(AUTH_SESSION_REFRESHED_EVENT, handleSessionRefreshed);

  return () => {
    window.removeEventListener(
      AUTH_SESSION_REFRESHED_EVENT,
      handleSessionRefreshed,
    );
  };
};
