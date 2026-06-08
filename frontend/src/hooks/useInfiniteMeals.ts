import { useCallback, useEffect, useRef, useState } from 'react';
import { Meal, PaginatedMeals } from '../types/meal';
import {
  buildInfiniteMealsLoadKey,
  mergeUniqueMeals,
} from './infinite-meals-utils';
import { useInfiniteScrollTrigger } from './useInfiniteScrollTrigger';

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
  promise: Promise<boolean>;
  controller: AbortController;
};

type SettledLoadEntry = {
  key: string;
  result: boolean;
};

const SEARCH_DEBOUNCE_MS = 300;

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

  const requestIdRef = useRef(0);
  const inFlightRef = useRef<InFlightEntry | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const loadedPageRef = useRef(0);
  const settledLoadRef = useRef<SettledLoadEntry | null>(null);

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
      const key = buildInfiniteMealsLoadKey(
        searchKeyword,
        pageToLoad,
        limit,
        currentReloadKey,
      );
      const currentInFlight = inFlightRef.current;

      if (currentInFlight && currentInFlight.key === key) {
        return currentInFlight.promise;
      }

      if (settledLoadRef.current?.key === key) {
        return Promise.resolve(settledLoadRef.current.result);
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

      let promise!: Promise<boolean>;

      promise = (async () => {
        try {
          const data = await fetchMeals({
            page: pageToLoad,
            keyword: snapshotKeyword || undefined,
            limit,
            signal: controller.signal,
          });

          if (requestId !== requestIdRef.current) return false;
          if (snapshotKeyword !== latestRef.current.keyword) return false;
          if (snapshotReloadKey !== latestRef.current.reloadKey) return false;

          setMeals((prev) => {
            if (pageToLoad === 1) {
              return data.items;
            }

            return mergeUniqueMeals(prev, data.items);
          });

          loadedPageRef.current = Math.max(loadedPageRef.current, pageToLoad);
          setHasMore(data.page < data.totalPages);
          settledLoadRef.current = { key, result: true };
          return true;
        } catch (error) {
          if (controller.signal.aborted) return false;
          if (requestId !== requestIdRef.current) return false;

          console.error('Menu load failed', error);
          setError('Could not load the menu. Tap to retry.');
          settledLoadRef.current = { key, result: false };
          return false;
        } finally {
          if (inFlightRef.current?.promise === promise) {
            inFlightRef.current = null;
          }

          if (requestId === requestIdRef.current) {
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

  const loadNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const { listRef, sentinelRef } = useInfiniteScrollTrigger({
    canLoadMore: !error && hasMore,
    isLoading,
    loadedPage: loadedPageRef.current,
    page,
    onLoadMore: loadNextPage,
  });

  const resetAndInvalidate = useCallback(() => {
    clearDebounceTimer();
    inFlightRef.current?.controller.abort();
    inFlightRef.current = null;
    settledLoadRef.current = null;
    requestIdRef.current += 1;
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
    const { keyword: currentKeyword, reloadKey: currentReloadKey } =
      latestRef.current;
    const nextReloadKey = currentReloadKey + 1;

    resetAndInvalidate();
    setReloadKey(nextReloadKey);
    return loadMeals(1, currentKeyword, nextReloadKey);
  }, [loadMeals, resetAndInvalidate]);

  const retry = useCallback(() => {
    setError(null);
    settledLoadRef.current = null;
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
