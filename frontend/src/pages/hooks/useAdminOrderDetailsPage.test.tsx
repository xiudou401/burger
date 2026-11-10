import { act, renderHook, waitFor } from '@testing-library/react';
import { fetchAdminOrder } from '../../api/orders';
import { useAdminOrderDetailsPage } from './useAdminOrderDetailsPage';
import type { Order } from '../../types/order';

vi.mock('../../api/orders', () => ({ fetchAdminOrder: vi.fn() }));

test('allows refreshing order details after another employee changes the order', async () => {
  const order = { id: 'order-A', status: 'ready' } as Order;
  vi.mocked(fetchAdminOrder)
    .mockResolvedValueOnce({ order })
    .mockResolvedValueOnce({ order: { ...order, status: 'completed' } });
  const { result } = renderHook(() => useAdminOrderDetailsPage(order.id));
  await waitFor(() => expect(result.current.order?.status).toBe('ready'));
  act(() => result.current.refresh());
  await waitFor(() => expect(result.current.order?.status).toBe('completed'));
  expect(fetchAdminOrder).toHaveBeenCalledTimes(2);
});
