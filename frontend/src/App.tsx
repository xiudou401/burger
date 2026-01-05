import MealsList from './components/Meals/MealsList';
import Cart from './components/Cart/Cart';
import FilterMeals from './components/FilterMeals/FilterMeals';
import { fetchMeals } from './api/meals';
import { useInfiniteMeals } from './hooks/useInfiniteMeals';

const App = () => {
  const { meals, isLoading, hasMore, listRef, sentinelRef, onSearch } =
    useInfiniteMeals({ fetchMeals, limit: 4 });

  return (
    <div className="App">
      <FilterMeals onSearch={onSearch} />

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
