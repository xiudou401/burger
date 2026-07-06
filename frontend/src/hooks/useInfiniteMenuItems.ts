import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  MenuItem,
  MenuItemCategory,
  PaginatedMenuItems,
} from '../types/menu-item';
import {
  buildInfiniteMenuItemsLoadKey,
  mergeUniqueMenuItems,
} from './infinite-menu-items-utils';
import { useInfiniteScrollTrigger } from './useInfiniteScrollTrigger';

type FetchMenuItemsFn = (params: {
  keyword?: string;
  category?: MenuItemCategory;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}) => Promise<PaginatedMenuItems>;

interface UseInfiniteMenuItemsOptions {
  fetchMenuItems: FetchMenuItemsFn;
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

export const useInfiniteMenuItems = ({
  fetchMenuItems,
  limit = 4,
}: UseInfiniteMenuItemsOptions) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<MenuItemCategory | undefined>();
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
    category,
    reloadKey,
  });

  useEffect(() => {
    latestRef.current = {
      keyword,
      category,
      reloadKey,
    };
  }, [category, keyword, reloadKey]);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current === null) return;

    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  const loadMenuItems = useCallback(
    (
      pageToLoad: number,
      searchKeyword: string,
      categoryToLoad: MenuItemCategory | undefined,
      currentReloadKey: number,
    ) => {
      const key = buildInfiniteMenuItemsLoadKey(
        searchKeyword,
        categoryToLoad ?? '',
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
      const snapshotCategory = categoryToLoad;
      const snapshotReloadKey = currentReloadKey;

      let promise!: Promise<boolean>;

      promise = (async () => {
        try {
          const data = await fetchMenuItems({
            page: pageToLoad,
            keyword: snapshotKeyword || undefined,
            category: snapshotCategory,
            limit,
            signal: controller.signal,
          });

          if (requestId !== requestIdRef.current) return false;
          if (snapshotKeyword !== latestRef.current.keyword) return false;
          if (snapshotCategory !== latestRef.current.category) return false;
          if (snapshotReloadKey !== latestRef.current.reloadKey) return false;

          setMenuItems((prev) => {
            if (pageToLoad === 1) {
              return data.items;
            }

            return mergeUniqueMenuItems(prev, data.items);
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
    [fetchMenuItems, limit],
  );

  useEffect(() => {
    loadMenuItems(page, keyword, category, reloadKey);
  }, [category, keyword, loadMenuItems, page, reloadKey]);

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
    setMenuItems([]);
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
        setCategory(undefined);
        setReloadKey((prev) => prev + 1);
        debounceTimerRef.current = null;
      }, SEARCH_DEBOUNCE_MS);
    },
    [clearDebounceTimer, resetAndInvalidate],
  );

  const reload = useCallback(() => {
    const {
      keyword: currentKeyword,
      category: currentCategory,
      reloadKey: currentReloadKey,
    } = latestRef.current;
    const nextReloadKey = currentReloadKey + 1;

    resetAndInvalidate();
    setReloadKey(nextReloadKey);
    return loadMenuItems(1, currentKeyword, currentCategory, nextReloadKey);
  }, [loadMenuItems, resetAndInvalidate]);

  const retry = useCallback(() => {
    setError(null);
    settledLoadRef.current = null;
    loadMenuItems(page, keyword, category, reloadKey);
  }, [category, keyword, loadMenuItems, page, reloadKey]);

  const onCategoryChange = useCallback(
    (nextCategory?: MenuItemCategory) => {
      clearDebounceTimer();
      resetAndInvalidate();
      setKeyword('');
      setCategory(nextCategory);
      setReloadKey((prev) => prev + 1);
    },
    [clearDebounceTimer, resetAndInvalidate],
  );

  return {
    menuItems,
    isLoading,
    error,
    hasMore,
    page,
    keyword,
    category,
    listRef,
    sentinelRef,
    onSearch,
    onCategoryChange,
    reload,
    retry,
  };
};
