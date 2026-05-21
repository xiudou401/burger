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

export const useInfiniteMeals = ({
  fetchMeals,
  limit = 4,
}: UseInfiniteMealsOptions) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMeals = useCallback(
    async (pageToLoad: number, searchKeyword: string) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);

      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = await fetchMeals({
          page: pageToLoad,
          keyword: searchKeyword || undefined,
          limit,
          signal: controller.signal,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

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

        setHasMore(data.page < data.totalPages);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (requestId === requestIdRef.current) {
          console.error('加载失败', error);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          abortControllerRef.current = null;
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [fetchMeals, limit],
  );

  useEffect(() => {
    loadMeals(page, keyword);
  }, [page, keyword, reloadKey, loadMeals]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!hasMore) return;
    if (!listRef.current || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (loadingRef.current) return;

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
  }, [hasMore]);

  const resetAndInvalidate = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestIdRef.current += 1;
    loadingRef.current = false;
    setIsLoading(false);
    setMeals([]);
    setHasMore(true);
    setPage(1);
  }, []);

  const onSearch = useCallback(
    (value: string) => {
      const k = value.trim();

      resetAndInvalidate();
      setKeyword(k);
      setReloadKey((prev) => prev + 1);
    },
    [resetAndInvalidate],
  );

  const reload = useCallback(() => {
    resetAndInvalidate();
    setReloadKey((prev) => prev + 1);
  }, [resetAndInvalidate]);

  return {
    meals,
    isLoading,
    hasMore,
    page,
    keyword,
    listRef,
    sentinelRef,
    onSearch,
    reload,
  };
};
