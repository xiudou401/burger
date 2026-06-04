import MealsList from '../components/Meals/MealsList';
import Cart from '../components/Cart/Cart';
import FilterMeals from '../components/FilterMeals/FilterMeals';
import AccountBar from '../components/Auth/AccountBar';
import MenuFeedStatus from '../components/Menu/MenuFeedStatus/MenuFeedStatus';
import MenuLayout from '../components/Menu/MenuLayout/MenuLayout';
import { fetchMeals } from '../api/meals';
import { useInfiniteMeals } from '../hooks/useInfiniteMeals';
import { useMenuRefreshPrompt } from './hooks/useMenuRefreshPrompt';

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
