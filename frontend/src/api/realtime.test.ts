import { io } from 'socket.io-client';
import { getAccessToken } from './auth-token';
import { connectCustomerRealtime } from './realtime';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));
vi.mock('./auth-token', () => ({ getAccessToken: vi.fn() }));

test('forwards customer connection, disconnect, error and order events', () => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    on: vi.fn((event, handler) => {
      listeners.set(event, handler);
    }),
  };
  vi.mocked(getAccessToken).mockReturnValue('token');
  vi.mocked(io).mockReturnValue(socket as never);
  const onConnected = vi.fn();
  const onDisconnected = vi.fn();
  const onOrderEvent = vi.fn();
  connectCustomerRealtime({ onConnected, onDisconnected, onOrderEvent });
  listeners.get('connect')!();
  listeners.get('disconnect')!();
  listeners.get('connect_error')!();
  const payload = { orderId: 'A', status: 'ready' };
  listeners.get('order:updated')!(payload);
  expect(onConnected).toHaveBeenCalledTimes(1);
  expect(onDisconnected).toHaveBeenCalledTimes(2);
  expect(onOrderEvent).toHaveBeenCalledWith('order:updated', payload);
});

test('returns null without an access token', () => {
  vi.mocked(io).mockClear();
  vi.mocked(getAccessToken).mockReturnValue(null);
  expect(connectCustomerRealtime()).toBeNull();
  expect(io).not.toHaveBeenCalled();
});
