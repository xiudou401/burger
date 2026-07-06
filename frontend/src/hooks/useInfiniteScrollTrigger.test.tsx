import { act, render } from '@testing-library/react';
import { useInfiniteScrollTrigger } from './useInfiniteScrollTrigger';

type HookProps = Parameters<typeof useInfiniteScrollTrigger>[0];

let observerCallback: IntersectionObserverCallback | null = null;
let observeMock: jest.Mock;
let disconnectMock: jest.Mock;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  disconnect = disconnectMock;
  observe = observeMock;
  takeRecords = jest.fn(() => []);
  unobserve = jest.fn();
}

const triggerIntersection = (isIntersecting = true) => {
  if (!observerCallback) {
    throw new Error('IntersectionObserver was not initialized');
  }

  observerCallback(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
};

const Harness = (props: HookProps) => {
  const { listRef, sentinelRef } = useInfiniteScrollTrigger(props);

  return (
    <div ref={listRef}>
      <div ref={sentinelRef} />
    </div>
  );
};

const renderHookHarness = (overrideProps: Partial<HookProps> = {}) => {
  const props: HookProps = {
    canLoadMore: true,
    isLoading: false,
    loadedPage: 1,
    page: 1,
    onLoadMore: jest.fn(),
    ...overrideProps,
  };

  return render(<Harness {...props} />);
};

describe('useInfiniteScrollTrigger', () => {
  beforeAll(() => {
    window.IntersectionObserver = MockIntersectionObserver;
  });

  beforeEach(() => {
    observerCallback = null;
    observeMock = jest.fn();
    disconnectMock = jest.fn();
  });

  it('does not observe or trigger when more items cannot be loaded', () => {
    const onLoadMore = jest.fn();

    renderHookHarness({ canLoadMore: false, onLoadMore });

    expect(observeMock).not.toHaveBeenCalled();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not observe or trigger while loading', () => {
    const onLoadMore = jest.fn();

    renderHookHarness({ isLoading: true, onLoadMore });

    expect(observeMock).not.toHaveBeenCalled();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not load when the requested page has not finished loading', () => {
    const onLoadMore = jest.fn();

    renderHookHarness({ loadedPage: 1, page: 2, onLoadMore });

    act(() => {
      triggerIntersection();
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('loads more when the sentinel enters the viewport', () => {
    const onLoadMore = jest.fn();

    renderHookHarness({ onLoadMore });

    act(() => {
      triggerIntersection();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not repeatedly load during the same loading cycle', () => {
    const onLoadMore = jest.fn();

    renderHookHarness({ onLoadMore });

    act(() => {
      triggerIntersection();
      triggerIntersection();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('releases the load lock after loading finishes', () => {
    const onLoadMore = jest.fn();
    const { rerender } = renderHookHarness({ onLoadMore });

    act(() => {
      triggerIntersection();
    });

    rerender(
      <Harness
        canLoadMore
        isLoading
        loadedPage={1}
        page={1}
        onLoadMore={onLoadMore}
      />,
    );
    rerender(
      <Harness
        canLoadMore
        isLoading={false}
        loadedPage={2}
        page={2}
        onLoadMore={onLoadMore}
      />,
    );

    act(() => {
      triggerIntersection();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});
