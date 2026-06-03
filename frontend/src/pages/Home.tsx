import { useEffect, useRef, useState } from 'react';
import MealsList from '../components/Meals/MealsList';
import Cart from '../components/Cart/Cart';
import FilterMeals from '../components/FilterMeals/FilterMeals';
import AccountBar from '../components/Auth/AccountBar';
import MenuFeedStatus from '../components/Menu/MenuFeedStatus/MenuFeedStatus';
import MenuLayout from '../components/Menu/MenuLayout/MenuLayout';
import { fetchMeals } from '../api/meals';
import { fetchMenuVersion } from '../api/menu-version';
import { useInfiniteMeals } from '../hooks/useInfiniteMeals';

const MENU_VERSION_POLL_MS = 30_000;

const useMenuRefreshPrompt = () => {
  const [hasMenuUpdate, setHasMenuUpdate] = useState(false);
  const baselineVersionRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    let controller: AbortController | null = null;

    const tick = async () => {
      controller = new AbortController();

      try {
        const nextVersion = await fetchMenuVersion(controller.signal);

        if (cancelled) return;

        if (baselineVersionRef.current === null) {
          baselineVersionRef.current = nextVersion;
        } else if (nextVersion !== baselineVersionRef.current) {
          setHasMenuUpdate(true);
        }
      } catch {
        // Ignore polling failures; the next tick will retry.
      } finally {
        controller = null;

        if (!cancelled) {
          timer = window.setTimeout(tick, MENU_VERSION_POLL_MS);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      controller?.abort();
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const acknowledgeMenuUpdate = async () => {
    setHasMenuUpdate(false);

    try {
      baselineVersionRef.current = await fetchMenuVersion();
    } catch {
      baselineVersionRef.current = null;
    }
  };

  return {
    hasMenuUpdate,
    acknowledgeMenuUpdate,
  };
};

const Home = () => {
  const {
    meals,
    isLoading,
    error,
    hasMore,
    listRef,
    sentinelRef,
    onSearch,
    reload,
    retry,
  } = useInfiniteMeals({ fetchMeals, limit: 4 });

  const { hasMenuUpdate, acknowledgeMenuUpdate } = useMenuRefreshPrompt();

  const refreshMenu = async () => {
    reload();
    await acknowledgeMenuUpdate();
  };

  return (
    <MenuLayout>
      <AccountBar />
      <FilterMeals onSearch={onSearch} />

      <MealsList meals={meals} ref={listRef} sentinelRef={sentinelRef} />

      <MenuFeedStatus
        hasMore={hasMore}
        hasMeals={meals.length > 0}
        isLoading={isLoading}
        error={error}
        hasMenuUpdate={hasMenuUpdate}
        onRefreshMenu={refreshMenu}
        onRetry={retry}
      />

      <Cart />
    </MenuLayout>
  );
};

export default Home;
