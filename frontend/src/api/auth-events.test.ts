import {
  notifyAuthSessionExpired,
  notifyAuthSessionRefreshed,
  subscribeToAuthSessionExpired,
  subscribeToAuthSessionRefreshed,
} from './auth-events';

describe('auth session events', () => {
  test('notifies subscribers when the current session expires', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToAuthSessionExpired(listener);

    notifyAuthSessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    notifyAuthSessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('provides refreshed auth state to subscribers', () => {
    const listener = jest.fn();
    const session = {
      accessToken: 'new-access-token',
      user: {
        id: 'user-1',
        name: 'Pat',
        email: 'pat@example.com',
        role: 'customer' as const,
        emailVerified: true,
        phoneVerified: false,
      },
    };
    const unsubscribe = subscribeToAuthSessionRefreshed(listener);

    notifyAuthSessionRefreshed(session);

    expect(listener).toHaveBeenCalledWith(session);

    unsubscribe();
    notifyAuthSessionRefreshed(session);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
