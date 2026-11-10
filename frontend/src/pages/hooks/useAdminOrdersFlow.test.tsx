import { act, renderHook, waitFor } from '@testing-library/react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/orders';
import { connectAdminRealtime } from '../../api/realtime';
import { ApiError } from '../../api/request';
import { useAdminOrdersPage } from './useAdminOrdersPage';
import type { Order } from '../../types/order';

vi.mock('../../api/orders', () => ({
  fetchAdminOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
}));
vi.mock('../../api/realtime', () => ({ connectAdminRealtime: vi.fn() }));
vi.mock('../../store/auth/hooks/useAuth', () => ({ useAuth: () => null }));

const order: Order = {
  id: 'order-A',
  status: 'confirmed',
  version: 3,
  items: [],
  totalCents: 1200,
  menuVersion: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(connectAdminRealtime).mockReturnValue({
    disconnect: vi.fn(),
  } as never);
  vi.mocked(fetchAdminOrders).mockResolvedValue({
    orders: [order],
    nextCursor: null,
  });
});

test('queries the selected view and refreshes complete versions after realtime changes', async () => {
  const { result, rerender } = renderHook(
    ({ view }) => useAdminOrdersPage(view),
    {
      initialProps: { view: 'kitchen' as 'kitchen' | 'past' },
    },
  );
  await waitFor(() => expect(result.current.orders).toHaveLength(1));
  expect(fetchAdminOrders).toHaveBeenCalledWith(
    expect.objectContaining({ view: 'kitchen' }),
  );
  vi.mocked(fetchAdminOrders).mockResolvedValue({
    orders: [{ ...order, status: 'preparing', version: 4 }],
    nextCursor: null,
  });
  const handlers = vi.mocked(connectAdminRealtime).mock.calls.at(-1)![0]!;
  act(() =>
    handlers.onOrderEvent?.('order:updated', {
      orderId: order.id,
      status: 'preparing',
      version: 4,
      updatedAt: order.updatedAt,
    }),
  );
  await waitFor(() => expect(result.current.orders[0].version).toBe(4));
  expect(result.current.orders[0].status).toBe('preparing');
  rerender({ view: 'past' });
  await waitFor(() =>
    expect(fetchAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ view: 'past' }),
    ),
  );
});

test('keeps server state during submission and refreshes instead of rolling back on conflict', async () => {
  let rejectUpdate!: (error: unknown) => void;
  vi.mocked(updateOrderStatus).mockReturnValue(
    new Promise((_, reject) => {
      rejectUpdate = reject;
    }),
  );
  const { result } = renderHook(() => useAdminOrdersPage());
  await waitFor(() => expect(result.current.orders).toHaveLength(1));
  let submission!: Promise<void>;
  act(() => {
    submission = result.current.changeStatus(order.id, 'preparing', 3);
  });
  expect(result.current.orders[0].status).toBe('confirmed');
  await act(async () => {
    await result.current.changeStatus(order.id, 'preparing', 3);
  });
  expect(updateOrderStatus).toHaveBeenCalledTimes(1);
  const second = { ...order, id: 'order-B' };
  vi.mocked(fetchAdminOrders).mockResolvedValue({
    orders: [{ ...order, status: 'ready', version: 5 }, second],
    nextCursor: null,
  });
  await act(async () => {
    rejectUpdate(new ApiError(409, { message: 'Version conflict' }));
    await submission;
  });
  expect(result.current.orders).toHaveLength(2);
  expect(result.current.orders[0].version).toBe(5);
  expect(result.current.error).toContain('Review its latest status');
  expect(result.current.updatingOrderIds).toEqual([]);
});

test('tracks connection state and pauses mutations while offline', async () => {
  const { result } = renderHook(() => useAdminOrdersPage());
  await waitFor(() => expect(result.current.orders).toHaveLength(1));
  const handlers = vi.mocked(connectAdminRealtime).mock.calls.at(-1)![0]!;
  act(() => handlers.onConnected?.());
  expect(result.current.connectionStatus).toBe('live');
  act(() => handlers.onDisconnected?.());
  expect(result.current.connectionStatus).toBe('reconnecting');
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => window.dispatchEvent(new Event('offline')));
  expect(result.current.connectionStatus).toBe('offline');
  await act(async () => {
    await result.current.changeStatus(order.id, 'preparing', 3);
  });
  expect(updateOrderStatus).not.toHaveBeenCalled();
  online.mockReturnValue(true);
  act(() => window.dispatchEvent(new Event('online')));
  expect(result.current.isOnline).toBe(true);
  online.mockRestore();
});

test('allows different orders to submit independently but blocks a duplicate on one order', async () => {
  const resolvers: Array<(value: { order: Order }) => void> = [];
  vi.mocked(updateOrderStatus).mockImplementation(
    () => new Promise((resolve) => resolvers.push(resolve)),
  );
  const { result } = renderHook(() => useAdminOrdersPage());
  await waitFor(() => expect(result.current.orders).toHaveLength(1));
  let first!: Promise<void>;
  let second!: Promise<void>;
  act(() => {
    first = result.current.changeStatus('order-A', 'preparing', 3);
    second = result.current.changeStatus('order-B', 'preparing', 3);
  });
  await act(async () => {
    await result.current.changeStatus('order-A', 'preparing', 3);
  });
  expect(updateOrderStatus).toHaveBeenCalledTimes(2);
  expect(result.current.updatingOrderIds).toEqual(['order-A', 'order-B']);
  await act(async () => {
    resolvers[0]({ order });
    resolvers[1]({ order });
    await Promise.all([first, second]);
  });
  expect(result.current.updatingOrderIds).toEqual([]);
});
