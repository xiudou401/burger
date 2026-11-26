import { act, renderHook } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { fetchOrder } from '../../api/orders';
import { connectCustomerRealtime } from '../../api/realtime';
import type { Order } from '../../types/order';
import { useOrderDetailsPage } from './useOrderDetailsPage';

vi.mock('../../api/orders', () => ({ fetchOrder: vi.fn() }));
vi.mock('../../api/realtime', () => ({ connectCustomerRealtime: vi.fn() }));

const orderId = '507f1f77bcf86cd799439012';
const otherId = '507f1f77bcf86cd799439013';
const makeOrder = (status: Order['status'] = 'preparing'): Order => ({
  id: orderId,
  status,
  version: 1,
  items: [],
  totalCents: 2400,
  menuVersion: 1,
  payment: {
    status: status === 'pending_payment' ? 'requires_payment' : 'paid',
    currency: 'aud',
  },
  createdAt: '2026-11-26T00:00:00Z',
  updatedAt: '2026-11-26T00:00:00Z',
});
let handlers: NonNullable<Parameters<typeof connectCustomerRealtime>[0]>;
const disconnect = vi.fn();
const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(fetchOrder).mockReset().mockResolvedValue({ order: makeOrder() });
  vi.mocked(connectCustomerRealtime).mockImplementation((callbacks) => {
    handlers = callbacks!;
    return { disconnect } as unknown as Socket;
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

test('polls silently after disconnect and refreshes immediately on reconnect', async () => {
  const { result, unmount } = renderHook(() => useOrderDetailsPage(orderId));
  await flush();
  act(() => {
    handlers.onDisconnected?.();
    handlers.onDisconnected?.();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(29_999);
  });
  expect(fetchOrder).toHaveBeenCalledTimes(1);
  vi.mocked(fetchOrder).mockResolvedValue({ order: makeOrder('ready') });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(result.current.order?.status).toBe('ready');
  expect(result.current.isLoading).toBe(false);
  vi.mocked(fetchOrder).mockResolvedValue({ order: makeOrder('completed') });
  await act(async () => {
    handlers.onConnected?.();
  });
  expect(result.current.order?.status).toBe('completed');
  const count = vi.mocked(fetchOrder).mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(fetchOrder).toHaveBeenCalledTimes(count);
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

test('ignores an old HTTP result after a newer realtime-triggered refresh', async () => {
  let resolveOld!: (result: { order: Order }) => void;
  vi.mocked(fetchOrder).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  const { result } = renderHook(() => useOrderDetailsPage(orderId));
  const oldSignal = vi.mocked(fetchOrder).mock.calls[0][1]!;
  vi.mocked(fetchOrder).mockResolvedValue({ order: makeOrder('ready') });
  await act(async () => {
    handlers.onOrderEvent?.('order:updated', {
      orderId,
      status: 'ready',
      updatedAt: '2026-11-26T00:01:00Z',
    });
  });
  expect(oldSignal.aborted).toBe(true);
  await act(async () => {
    resolveOld({ order: makeOrder('preparing') });
  });
  expect(result.current.order?.status).toBe('ready');
  expect(result.current.isLoading).toBe(false);
});

test('does not fetch for other orders and cancels work on unmount', async () => {
  const { unmount } = renderHook(() => useOrderDetailsPage(orderId));
  await flush();
  act(() =>
    handlers.onOrderEvent?.('order:updated', {
      orderId: otherId,
      status: 'ready',
      updatedAt: '',
    }),
  );
  expect(fetchOrder).toHaveBeenCalledTimes(1);
  let signal: AbortSignal | undefined;
  vi.mocked(fetchOrder).mockImplementation((_id, nextSignal) => {
    signal = nextSignal;
    return new Promise(() => {});
  });
  act(() => handlers.onDisconnected?.());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000);
  });
  unmount();
  expect(signal?.aborted).toBe(true);
  act(() => handlers.onDisconnected?.());
  await vi.advanceTimersByTimeAsync(60_000);
  expect(fetchOrder).toHaveBeenCalledTimes(2);
});

test('restarts payment confirmation safely on reconnect and stops once paid', async () => {
  vi.mocked(fetchOrder).mockResolvedValue({
    order: makeOrder('pending_payment'),
  });
  const { result } = renderHook(() =>
    useOrderDetailsPage(orderId, { confirmPayment: true }),
  );
  await flush();
  await act(async () => {
    handlers.onConnected?.();
  });
  expect(fetchOrder).toHaveBeenCalledTimes(2);
  vi.mocked(fetchOrder).mockResolvedValue({ order: makeOrder('confirmed') });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  expect(fetchOrder).toHaveBeenCalledTimes(3);
  expect(result.current.order?.status).toBe('confirmed');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  expect(fetchOrder).toHaveBeenCalledTimes(3);
});

test('uses fallback if no socket is available and retries after HTTP errors', async () => {
  vi.mocked(connectCustomerRealtime).mockReturnValue(null);
  vi.mocked(fetchOrder).mockRejectedValueOnce(new Error('Offline'));
  const { result } = renderHook(() => useOrderDetailsPage(orderId));
  await flush();
  expect(result.current.error).toBe('Offline');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000);
  });
  expect(result.current.error).toBeNull();
  expect(result.current.order?.status).toBe('preparing');
});

test('does not connect or fetch an invalid order ID', async () => {
  const { result } = renderHook(() => useOrderDetailsPage('invalid'));
  await flush();
  expect(result.current.error).toBe('Order not found');
  expect(fetchOrder).not.toHaveBeenCalled();
  expect(connectCustomerRealtime).not.toHaveBeenCalled();
});

test('cancels the old order request when the route changes', async () => {
  let resolveOld!: (result: { order: Order }) => void;
  vi.mocked(fetchOrder).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  const { result, rerender } = renderHook(({ id }) => useOrderDetailsPage(id), {
    initialProps: { id: orderId },
  });
  vi.mocked(fetchOrder).mockResolvedValue({
    order: { ...makeOrder('ready'), id: otherId },
  });
  rerender({ id: otherId });
  await flush();
  await act(async () => {
    resolveOld({ order: makeOrder() });
  });
  expect(result.current.order?.id).toBe(otherId);
});
