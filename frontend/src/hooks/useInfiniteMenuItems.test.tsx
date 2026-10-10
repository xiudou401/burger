import { act, fireEvent, render, screen } from '@testing-library/react';
import { useInfiniteMenuItems } from './useInfiniteMenuItems';
import type { MenuItem, PaginatedMenuItems } from '../types/menu-item';

type FetchMenuItemsFn = Parameters<
  typeof useInfiniteMenuItems
>[0]['fetchMenuItems'];
type HookResult = ReturnType<typeof useInfiniteMenuItems>;

const menuItem = (id: string): MenuItem => ({
  id,
  name: `MenuItem ${id}`,
  description: `Description ${id}`,
  priceCents: Number(id) || 1,
  image: `${id}.jpg`,
  category: 'burger',
  isAvailable: true,
});

const pageData = (
  items: MenuItem[],
  page: number,
  totalPages = page,
): PaginatedMenuItems => ({
  items,
  page,
  limit: 4,
  total: items.length,
  totalPages,
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
};

let observerCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

const triggerIntersection = () => {
  if (!observerCallback) {
    throw new Error('IntersectionObserver was not initialized');
  }

  observerCallback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
};

const TestHarness = ({
  fetchMenuItems,
  onRender,
}: {
  fetchMenuItems: FetchMenuItemsFn;
  onRender: (result: HookResult) => void;
}) => {
  const result = useInfiniteMenuItems({ fetchMenuItems, limit: 4 });
  onRender(result);

  return (
    <div ref={result.listRef}>
      <button type="button" onClick={() => result.onSearch('a')}>
        Search a
      </button>
      <button type="button" onClick={() => result.onSearch('ab')}>
        Search ab
      </button>
      <button type="button" onClick={() => result.onSearch('abc')}>
        Search abc
      </button>
      <button type="button" onClick={result.retry}>
        Retry
      </button>
      <div ref={result.sentinelRef} />
      <div data-testid="menu-items">
        {result.menuItems.map((item) => item.id).join(',')}
      </div>
      <div data-testid="error">{result.error}</div>
    </div>
  );
};

describe('useInfiniteMenuItems', () => {
  beforeAll(() => {
    window.IntersectionObserver = MockIntersectionObserver;
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    observerCallback = null;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('debounces search and fetches only the latest keyword', async () => {
    const initialLoad = deferred<PaginatedMenuItems>();
    const searchLoad = deferred<PaginatedMenuItems>();
    const fetchMenuItems = vi
      .fn<FetchMenuItemsFn>()
      .mockReturnValueOnce(initialLoad.promise)
      .mockReturnValueOnce(searchLoad.promise);

    render(<TestHarness fetchMenuItems={fetchMenuItems} onRender={() => {}} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMenuItems).toHaveBeenCalledTimes(1);
    await act(async () => {
      initialLoad.resolve(pageData([], 1));
      await initialLoad.promise;
    });
    fetchMenuItems.mockClear();

    fireEvent.click(screen.getByText('Search a'));
    fireEvent.click(screen.getByText('Search ab'));
    fireEvent.click(screen.getByText('Search abc'));

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(fetchMenuItems).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMenuItems).toHaveBeenCalledTimes(1);
    expect(fetchMenuItems).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'abc', page: 1, limit: 4 }),
    );
    await act(async () => {
      searchLoad.resolve(pageData([], 1));
    });
  });

  it('shows an error and retries the current request after a failed load', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const initialLoad = deferred<PaginatedMenuItems>();
    const retryLoad = deferred<PaginatedMenuItems>();
    const fetchMenuItems = vi
      .fn<FetchMenuItemsFn>()
      .mockReturnValueOnce(initialLoad.promise)
      .mockReturnValueOnce(retryLoad.promise);

    render(<TestHarness fetchMenuItems={fetchMenuItems} onRender={() => {}} />);
    await act(async () => {
      initialLoad.reject(new Error('Network down'));
      await initialLoad.promise.catch(() => {});
    });

    expect(
      screen.getByText('Could not load the menu. Retry.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Retry'));

    await act(async () => {
      retryLoad.resolve(pageData([menuItem('1')], 1));
      await retryLoad.promise;
    });

    expect(screen.getByTestId('menu-items').textContent).toBe('1');
    expect(fetchMenuItems).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });

  it('returns whether reload completed successfully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    let result!: HookResult;
    const initialLoad = deferred<PaginatedMenuItems>();
    const reloadLoad = deferred<PaginatedMenuItems>();
    const fetchMenuItems = vi
      .fn<FetchMenuItemsFn>()
      .mockReturnValueOnce(initialLoad.promise)
      .mockReturnValueOnce(reloadLoad.promise);

    render(
      <TestHarness
        fetchMenuItems={fetchMenuItems}
        onRender={(nextResult) => {
          result = nextResult;
        }}
      />,
    );

    await act(async () => {
      initialLoad.resolve(pageData([menuItem('1')], 1));
      await initialLoad.promise;
    });

    const reloadPromise = result.reload();

    await act(async () => {
      reloadLoad.reject(new Error('Network down'));
      await reloadLoad.promise.catch(() => {});
    });

    await expect(reloadPromise).resolves.toBe('failed');
    expect(
      screen.getByText('Could not load the menu. Retry.'),
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('deduplicates menu items when appending the next page', async () => {
    let result!: HookResult;
    const firstPage = deferred<PaginatedMenuItems>();
    const secondPage = deferred<PaginatedMenuItems>();
    const fetchMenuItems = vi
      .fn<FetchMenuItemsFn>()
      .mockReturnValueOnce(firstPage.promise)
      .mockReturnValueOnce(secondPage.promise);

    render(
      <TestHarness
        fetchMenuItems={fetchMenuItems}
        onRender={(nextResult) => {
          result = nextResult;
        }}
      />,
    );
    await act(async () => {
      firstPage.resolve(pageData([menuItem('1'), menuItem('2')], 1, 2));
      await firstPage.promise;
    });

    expect(result.menuItems.map((item) => item.id)).toEqual(['1', '2']);

    act(() => {
      triggerIntersection();
    });
    await act(async () => {
      secondPage.resolve(pageData([menuItem('2'), menuItem('3')], 2, 2));
      await secondPage.promise;
    });

    expect(result.menuItems.map((item) => item.id)).toEqual(['1', '2', '3']);
    expect(fetchMenuItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 4 }),
    );
  });
});
