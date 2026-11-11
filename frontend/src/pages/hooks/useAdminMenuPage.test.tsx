import { renderHook, waitFor } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import { fetchMenuItems } from '../../api/menu-items';
import { useAdminMenuPage } from './useAdminMenuPage';

vi.mock('../../api/menu-items', () => ({ fetchMenuItems: vi.fn() }));

test('loads every menu page instead of silently truncating at 100 items', async () => {
  vi.mocked(fetchMenuItems)
    .mockResolvedValueOnce({ items: [{ id: 'first' }], totalPages: 2 } as never)
    .mockResolvedValueOnce({ items: [{ id: 'last' }], totalPages: 2 } as never);
  const { result } = renderHook(() => useAdminMenuPage());
  await waitFor(() => expect(result.current.menuItems).toHaveLength(2));
  expect(fetchMenuItems).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      page: 2,
      limit: 100,
      signal: expect.any(AbortSignal),
    }),
  );
  expect(result.current.menuItems.map((item) => item.id)).toEqual([
    'first',
    'last',
  ]);
});
