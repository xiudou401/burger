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

  // 用 ref 做“请求锁”，避免重复请求
  const loadingRef = useRef(false);

  const loadMeals = useCallback(
    async (pageToLoad: number, searchKeyword: string) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);
      console.log(`📡 发起请求: 第 ${pageToLoad} 页`);

      try {
        const data = await fetchMeals({
          page: pageToLoad,
          keyword: searchKeyword || undefined,
          limit,
        });

        setMeals((prev) => {
          if (pageToLoad === 1) return data.items;

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
        console.error('加载失败', error);
      } finally {
        // 你原来有 500ms 的“解锁延迟”，我保持不变
        setTimeout(() => {
          setIsLoading(false);
          loadingRef.current = false;
          console.log('🔓 锁已释放，可以进行下一次翻页');
        }, 500);
      }
    },
    [fetchMeals, limit],
  );

  // page / keyword 变化 -> 自动加载
  useEffect(() => {
    loadMeals(page, keyword);
  }, [page, keyword, loadMeals]);

  // 无限滚动：观察 sentinel
  useEffect(() => {
    if (!hasMore || isLoading || loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          setPage((prev) => {
            console.log(`🚀 确认触底，允许从第 ${prev} 页翻到 ${prev + 1} 页`);
            return prev + 1;
          });
        }
      },
      {
        root: listRef.current,
        threshold: 0.1,
        rootMargin: '0px',
      },
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const onSearch = useCallback((value: string) => {
    const k = value;

    // 先重置分页相关
    setMeals([]);
    setHasMore(true);

    // 关键：只通过 state 变化触发请求，不要手动再 loadMeals
    setPage(1);
    setKeyword(k);

    // 可选：如果你希望“立刻锁住”，避免 observer 抢跑
    loadingRef.current = false;
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
    // 如果你未来想手动触发刷新，也可以暴露：
    reload: () => loadMeals(1, keyword),
  };
};
