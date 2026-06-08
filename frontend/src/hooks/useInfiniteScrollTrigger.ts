import { useEffect, useRef } from 'react';

interface UseInfiniteScrollTriggerOptions {
  canLoadMore: boolean;
  isLoading: boolean;
  loadedPage: number;
  page: number;
  onLoadMore: () => void;
}

export const useInfiniteScrollTrigger = ({
  canLoadMore,
  isLoading,
  loadedPage,
  page,
  onLoadMore,
}: UseInfiniteScrollTriggerOptions) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadLockedRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      loadLockedRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    if (!canLoadMore || isLoading) return;
    if (!listRef.current || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loadedPage < page) return;
        if (loadLockedRef.current) return;

        loadLockedRef.current = true;
        onLoadMore();
      },
      {
        root: listRef.current,
        threshold: 0.1,
        rootMargin: '0px',
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [canLoadMore, isLoading, loadedPage, onLoadMore, page]);

  return {
    listRef,
    sentinelRef,
  };
};
