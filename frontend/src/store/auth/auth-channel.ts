const AUTH_CHANNEL_NAME = 'burger-auth';

export interface AuthChannelMessage {
  type: 'logout';
}

export const createAuthChannel = () => {
  if (
    typeof window === 'undefined' ||
    typeof window.BroadcastChannel === 'undefined'
  ) {
    return null;
  }

  return new BroadcastChannel(AUTH_CHANNEL_NAME);
};

export const broadcastAuthLogout = () => {
  const channel = createAuthChannel();
  channel?.postMessage({ type: 'logout' } satisfies AuthChannelMessage);
  channel?.close();
};
