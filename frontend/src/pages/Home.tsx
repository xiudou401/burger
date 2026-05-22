import MealsList from '../components/Meals/MealsList';
import Cart from '../components/Cart/Cart';
import FilterMeals from '../components/FilterMeals/FilterMeals';
import AccountBar from '../components/Auth/AccountBar';
import MenuFeedStatus from '../components/Menu/MenuFeedStatus/MenuFeedStatus';
import MenuLayout from '../components/Menu/MenuLayout/MenuLayout';
import { fetchMeals } from '../api/meals';
import { useInfiniteMeals } from '../hooks/useInfiniteMeals';

const Home = () => {
  const {
    meals,
    isLoading,
    error,
    hasMore,
    listRef,
    sentinelRef,
    onSearch,
    retry,
  } =
    useInfiniteMeals({ fetchMeals, limit: 4 });

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
        onRetry={retry}
      />

      <Cart />
    </MenuLayout>
  );
};

export default Home;
