import { useCallback, useEffect, useRef, useState } from 'react';
import { Meal, PaginatedMeals } from '../types/meal';

type FetchMealsFn = (params: {
  keyword?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}) => Promise<PaginatedMeals>;

interface UseInfiniteMealsOptions {
  fetchMeals: FetchMealsFn;
  limit?: number;
}

type InFlightEntry = {
  key: string;
  promise: Promise<void>;
  controller: AbortController;
};

const SEARCH_DEBOUNCE_MS = 300;

const buildLoadKey = (
  keyword: string,
  page: number,
  limit: number,
  reloadKey: number,
) => `${keyword}::${page}::${limit}::${reloadKey}`;

export const useInfiniteMeals = ({
  fetchMeals,
  limit = 4,
}: UseInfiniteMealsOptions) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const pageAdvanceLockedRef = useRef(false);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef<InFlightEntry | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const loadedPageRef = useRef(0);

  const latestRef = useRef({
    keyword,
    reloadKey,
  });

  useEffect(() => {
    latestRef.current = {
      keyword,
      reloadKey,
    };
  }, [keyword, reloadKey]);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current === null) return;

    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  const loadMeals = useCallback(
    (pageToLoad: number, searchKeyword: string, currentReloadKey: number) => {
      const key = buildLoadKey(
        searchKeyword,
        pageToLoad,
        limit,
        currentReloadKey,
      );
      const currentInFlight = inFlightRef.current;

      if (currentInFlight && currentInFlight.key === key) {
        return currentInFlight.promise;
      }

      if (currentInFlight) {
        currentInFlight.controller.abort();
        inFlightRef.current = null;
      }

      setIsLoading(true);
      setError(null);

      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      const snapshotKeyword = searchKeyword;
      const snapshotReloadKey = currentReloadKey;

      let promise!: Promise<void>;

      promise = (async () => {
        try {
          const data = await fetchMeals({
            page: pageToLoad,
            keyword: snapshotKeyword || undefined,
            limit,
            signal: controller.signal,
          });

          if (requestId !== requestIdRef.current) return;
          if (snapshotKeyword !== latestRef.current.keyword) return;
          if (snapshotReloadKey !== latestRef.current.reloadKey) return;

          setMeals((prev) => {
            if (pageToLoad === 1) {
              return data.items;
            }

            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = data.items.filter(
              (item) => !existingIds.has(item.id),
            );

            return [...prev, ...newItems];
          });

          loadedPageRef.current = Math.max(loadedPageRef.current, pageToLoad);
          setHasMore(data.page < data.totalPages);
        } catch (error) {
          if (controller.signal.aborted) return;
          if (requestId !== requestIdRef.current) return;

          console.error('加载失败', error);
          setError('加载失败，点击重试');
        } finally {
          if (inFlightRef.current?.promise === promise) {
            inFlightRef.current = null;
          }

          if (requestId === requestIdRef.current) {
            pageAdvanceLockedRef.current = false;
            setIsLoading(false);
          }
        }
      })();

      inFlightRef.current = {
        key,
        promise,
        controller,
      };

      return promise;
    },
    [fetchMeals, limit],
  );

  useEffect(() => {
    loadMeals(page, keyword, reloadKey);
  }, [page, keyword, reloadKey, loadMeals]);

  useEffect(() => {
    return () => {
      inFlightRef.current?.controller.abort();
      inFlightRef.current = null;
      clearDebounceTimer();
    };
  }, [clearDebounceTimer]);

  useEffect(() => {
    if (error) return;
    if (!hasMore) return;
    if (!listRef.current || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (inFlightRef.current) return;
        if (loadedPageRef.current < page) return;
        if (pageAdvanceLockedRef.current) return;

        pageAdvanceLockedRef.current = true;
        setPage((prev) => prev + 1);
      },
      {
        root: listRef.current,
        threshold: 0.1,
        rootMargin: '0px',
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [error, hasMore, page]);

  const resetAndInvalidate = useCallback(() => {
    clearDebounceTimer();
    inFlightRef.current?.controller.abort();
    inFlightRef.current = null;
    requestIdRef.current += 1;
    pageAdvanceLockedRef.current = false;
    loadedPageRef.current = 0;
    setIsLoading(false);
    setError(null);
    setMeals([]);
    setHasMore(true);
    setPage(1);
  }, [clearDebounceTimer]);

  const onSearch = useCallback(
    (value: string) => {
      clearDebounceTimer();

      debounceTimerRef.current = window.setTimeout(() => {
        const k = value.trim();

        resetAndInvalidate();
        setKeyword(k);
        setReloadKey((prev) => prev + 1);
        debounceTimerRef.current = null;
      }, SEARCH_DEBOUNCE_MS);
    },
    [clearDebounceTimer, resetAndInvalidate],
  );

  const reload = useCallback(() => {
    resetAndInvalidate();
    setReloadKey((prev) => prev + 1);
  }, [resetAndInvalidate]);

  const retry = useCallback(() => {
    setError(null);
    loadMeals(page, keyword, reloadKey);
  }, [keyword, loadMeals, page, reloadKey]);

  return {
    meals,
    isLoading,
    error,
    hasMore,
    page,
    keyword,
    listRef,
    sentinelRef,
    onSearch,
    reload,
    retry,
  };
};
