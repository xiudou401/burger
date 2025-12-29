import { useEffect, useState, useRef, useCallback } from 'react';
import MealsList from './components/Meals/MealsList';
import Cart from './components/Cart/Cart';
import FilterMeals from './components/FilterMeals/FilterMeals';
import { Meal } from './types/meal';
import { fetchMeals } from './api/meals';

const App = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 🔹 listRef 绑定到 MealsList 的滚动容器
  const listRef = useRef<HTMLDivElement | null>(null);
  // 🔹 sentinelRef 绑定到列表末尾的触发点
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 🔹 加载数据函数
  // App.tsx
  // 在组件顶部定义一个状态锁 Ref
  const loadingRef = useRef(false);

  const loadMeals = useCallback(
    async (pageToLoad: number, searchKeyword: string) => {
      // 使用 Ref 检查，而不是 state，防止函数重建导致的竞态问题
      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true); // 仅用于控制 UI 显示
      console.log(`📡 发起请求: 第 ${pageToLoad} 页`);

      try {
        const data = await fetchMeals({
          page: pageToLoad,
          keyword: searchKeyword || undefined,
          limit: 4,
        });

        setMeals((prev) => {
          if (pageToLoad === 1) return data.items;
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = data.items.filter(
            (item) => !existingIds.has(item.id)
          );
          console.log(
            `✅ 第 ${pageToLoad} 页返回 ${data.items.length} 条，实际新增 ${newItems.length} 条`
          );
          return [...prev, ...newItems];
        });

        setHasMore(data.page < data.totalPages);
      } catch (error) {
        console.error('加载失败', error);
      } finally {
        // 确保 DOM 渲染完成，哨兵被挤出视野后，再释放锁
        setTimeout(() => {
          setIsLoading(false);
          loadingRef.current = false;
          console.log('🔓 锁已释放，可以进行下一次翻页');
        }, 500);
      }
    },
    [keyword] // 🛑 核心修改：去掉 [isLoading] 依赖！
  );
  // 🔹 逻辑 A：专门负责根据 Page 加载数据
  // 监听 page 变化
  // App.tsx 中的观察者 useEffect
  useEffect(() => {
    loadMeals(page, keyword);
  }, [page, loadMeals, keyword]);
  useEffect(() => {
    // 🔹 如果正在加载，绝不观察，也绝不触发 setPage
    if (!hasMore || isLoading || loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 🔹 再次双重检查锁
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
      }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();

    // 🔹 依赖项必须包含 isLoading，这样加载结束后能重新启动观察
  }, [hasMore, isLoading, meals.length]);

  // 🔹 搜索处理
  const onSearch = (value: string) => {
    const k = value.trim();
    setKeyword(k);
    setMeals([]);
    setHasMore(true);

    // 如果已经在第 1 页，设置 page=1 不会触发 useEffect，所以手动调一次
    // 如果不在第 1 页，setPage(1) 会触发上面的 useEffect 执行 loadMeals
    if (page === 1) {
      loadMeals(1, k);
    } else {
      setPage(1);
    }
  };

  return (
    <div className="App">
      <FilterMeals onSearch={onSearch} />

      {/* 🔹 关键：传入 ref 以获取滚动容器 */}
      <MealsList meals={meals} ref={listRef} sentinelRef={sentinelRef} />

      {!hasMore && meals.length > 0 && (
        <p style={{ textAlign: 'center', color: '#999', padding: '10px' }}>
          没有更多餐点供选择了
        </p>
      )}

      {isLoading && (
        <p
          style={{
            textAlign: 'center',
            position: 'fixed',
            bottom: '100px',
            width: '100%',
          }}
        >
          加载中...
        </p>
      )}

      <Cart />
    </div>
  );
};

export default App;
