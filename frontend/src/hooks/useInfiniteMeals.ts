import { useCallback, useEffect, useRef, useState } from 'react';
import { Meal, PaginatedMeals } from '../types/meal';

type FetchMealsFn = (params: {
  keyword?: string;
  page?: number;
  limit?: number;
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

  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadMeals = useCallback(
    async (pageToLoad: number, searchKeyword: string) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);

      const requestId = ++requestIdRef.current;
      console.log(`📡 发起请求: 第 ${pageToLoad} 页, keyword=${searchKeyword}`);

      try {
        const data = await fetchMeals({
          page: pageToLoad,
          keyword: searchKeyword || undefined,
          limit,
        });

        // ✅ 如果不是最新请求，直接丢弃
        if (requestId !== requestIdRef.current) {
          console.log('⏭️ 旧请求结果已丢弃');
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

          console.log(
            `✅ 第 ${pageToLoad} 页返回 ${data.items.length} 条，实际新增 ${newItems.length} 条`,
          );

          return [...prev, ...newItems];
        });

        setHasMore(data.page < data.totalPages);
      } catch (error) {
        // ✅ 只有最新请求才处理 loading / error 的语义
        if (requestId === requestIdRef.current) {
          console.error('加载失败', error);
        }
      } finally {
        // ✅ 只有当前请求仍然是最新请求时才解锁
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          loadingRef.current = false;
          console.log('🔓 锁已释放，可以进行下一次翻页');
        }
      }
    },
    [fetchMeals, limit],
  );

  useEffect(() => {
    loadMeals(page, keyword);
  }, [page, keyword, loadMeals]);

  useEffect(() => {
    if (!hasMore || isLoading) return;
    if (!listRef.current || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (loadingRef.current) return;

        setPage((prev) => {
          console.log(`🚀 确认触底，允许从第 ${prev} 页翻到 ${prev + 1} 页`);
          return prev + 1;
        });
      },
      {
        root: listRef.current,
        threshold: 0.1,
        rootMargin: '0px',
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const onSearch = useCallback((value: string) => {
    const k = value.trim();

    // ✅ 使旧请求全部失效
    requestIdRef.current += 1;

    // ✅ 重置显示状态
    loadingRef.current = false;
    setIsLoading(false);
    setMeals([]);
    setHasMore(true);
    setPage(1);
    setKeyword(k);
  }, []);

  const reload = useCallback(() => {
    requestIdRef.current += 1;
    loadingRef.current = false;
    setIsLoading(false);
    setMeals([]);
    setHasMore(true);
    setPage(1);
  }, []);

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
