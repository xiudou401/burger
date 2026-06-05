import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useInfiniteMeals } from './useInfiniteMeals';
import type { Meal, PaginatedMeals } from '../types/meal';

type FetchMealsFn = Parameters<typeof useInfiniteMeals>[0]['fetchMeals'];
type HookResult = ReturnType<typeof useInfiniteMeals>;

const meal = (id: string): Meal => ({
  id,
  name: `Meal ${id}`,
  description: `Description ${id}`,
  price: Number(id) || 1,
  image: `${id}.jpg`,
});

const pageData = (
  items: Meal[],
  page: number,
  totalPages = page,
): PaginatedMeals => ({
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

  disconnect = jest.fn();
  observe = jest.fn();
  takeRecords = jest.fn(() => []);
  unobserve = jest.fn();
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
  fetchMeals,
  onRender,
}: {
  fetchMeals: FetchMealsFn;
  onRender: (result: HookResult) => void;
}) => {
  const result = useInfiniteMeals({ fetchMeals, limit: 4 });
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
      <div data-testid="meals">{result.meals.map((item) => item.id).join(',')}</div>
      <div data-testid="error">{result.error}</div>
    </div>
  );
};

describe('useInfiniteMeals', () => {
  beforeAll(() => {
    window.IntersectionObserver = MockIntersectionObserver;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    observerCallback = null;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounces search and fetches only the latest keyword', async () => {
    const initialLoad = deferred<PaginatedMeals>();
    const searchLoad = deferred<PaginatedMeals>();
    const fetchMeals = jest
      .fn<ReturnType<FetchMealsFn>, Parameters<FetchMealsFn>>()
      .mockReturnValueOnce(initialLoad.promise)
      .mockReturnValueOnce(searchLoad.promise);

    render(<TestHarness fetchMeals={fetchMeals} onRender={() => {}} />);

    await waitFor(() => expect(fetchMeals).toHaveBeenCalledTimes(1));
    await act(async () => {
      initialLoad.resolve(pageData([], 1));
    });
    fetchMeals.mockClear();

    fireEvent.click(screen.getByText('Search a'));
    fireEvent.click(screen.getByText('Search ab'));
    fireEvent.click(screen.getByText('Search abc'));

    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(fetchMeals).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(fetchMeals).toHaveBeenCalledTimes(1));
    expect(fetchMeals).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'abc', page: 1, limit: 4 }),
    );
    await act(async () => {
      searchLoad.resolve(pageData([], 1));
    });
  });

  it('shows an error and retries the current request after a failed load', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const initialLoad = deferred<PaginatedMeals>();
    const retryLoad = deferred<PaginatedMeals>();
    const fetchMeals = jest
      .fn<ReturnType<FetchMealsFn>, Parameters<FetchMealsFn>>()
      .mockReturnValueOnce(initialLoad.promise)
      .mockReturnValueOnce(retryLoad.promise);

    render(<TestHarness fetchMeals={fetchMeals} onRender={() => {}} />);
    await act(async () => {
      initialLoad.reject(new Error('Network down'));
    });

    await screen.findByText('Could not load the menu. Tap to retry.');

    fireEvent.click(screen.getByText('Retry'));

    await act(async () => {
      retryLoad.resolve(pageData([meal('1')], 1));
    });

    await waitFor(() => expect(screen.getByTestId('meals').textContent).toBe('1'));
    expect(fetchMeals).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });

  it('returns whether reload completed successfully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    let result!: HookResult;
    const initialLoad = deferred<PaginatedMeals>();
    const reloadLoad = deferred<PaginatedMeals>();
    const fetchMeals = jest
      .fn<ReturnType<FetchMealsFn>, Parameters<FetchMealsFn>>()
      .mockReturnValueOnce(initialLoad.promise)
      .mockReturnValueOnce(reloadLoad.promise);

    render(
      <TestHarness
        fetchMeals={fetchMeals}
        onRender={(nextResult) => {
          result = nextResult;
        }}
      />,
    );

    await act(async () => {
      initialLoad.resolve(pageData([meal('1')], 1));
    });

    const reloadPromise = result.reload();

    await act(async () => {
      reloadLoad.reject(new Error('Network down'));
    });

    await expect(reloadPromise).resolves.toBe(false);
    await screen.findByText('Could not load the menu. Tap to retry.');
    consoleErrorSpy.mockRestore();
  });

  it('deduplicates meals when appending the next page', async () => {
    let result!: HookResult;
    const firstPage = deferred<PaginatedMeals>();
    const secondPage = deferred<PaginatedMeals>();
    const fetchMeals = jest
      .fn<ReturnType<FetchMealsFn>, Parameters<FetchMealsFn>>()
      .mockReturnValueOnce(firstPage.promise)
      .mockReturnValueOnce(secondPage.promise);

    render(
      <TestHarness
        fetchMeals={fetchMeals}
        onRender={(nextResult) => {
          result = nextResult;
        }}
      />,
    );
    await act(async () => {
      firstPage.resolve(pageData([meal('1'), meal('2')], 1, 2));
    });

    await waitFor(() => expect(result.meals.map((item) => item.id)).toEqual(['1', '2']));

    act(() => {
      triggerIntersection();
    });
    await act(async () => {
      secondPage.resolve(pageData([meal('2'), meal('3')], 2, 2));
    });

    await waitFor(() =>
      expect(result.meals.map((item) => item.id)).toEqual(['1', '2', '3']),
    );
    expect(fetchMeals).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 4 }),
    );
  });
});
