import { useState } from 'react';
import MealsList from '../components/Meals/MealsList';
import Cart from '../components/Cart/Cart';
import FilterMeals from '../components/FilterMeals/FilterMeals';
import AccountBar from '../components/Auth/AccountBar';
import MenuFeedStatus from '../components/Menu/MenuFeedStatus/MenuFeedStatus';
import MenuLayout from '../components/Menu/MenuLayout/MenuLayout';
import { fetchMeals } from '../api/meals';
import { useInfiniteMeals } from '../hooks/useInfiniteMeals';
import { useMenuRefreshPrompt } from './hooks/useMenuRefreshPrompt';
import { useCartSelector } from '../store/cart/hooks/useCartSelector';
import type { MealCategory } from '../types/meal';
import classes from './Home.module.css';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'burger', label: 'Burgers', category: 'burger' },
  { id: 'side', label: 'Sides', category: 'side' },
  { id: 'drink', label: 'Drinks', category: 'drink' },
  { id: 'dessert', label: 'Desserts', category: 'dessert' },
  { id: 'combo', label: 'Combos', category: 'combo' },
] satisfies Array<{
  id: string;
  label: string;
  category?: MealCategory;
}>;

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const {
    meals,
    isLoading,
    error,
    hasMore,
    listRef,
    sentinelRef,
    onSearch,
    onCategoryChange,
    reload,
    retry,
  } = useInfiniteMeals({ fetchMeals, limit: 4 });

  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const { hasMenuUpdate, acknowledgeMenuUpdate } =
    useMenuRefreshPrompt(menuVersion);

  const refreshMenu = async () => {
    const refreshed = await reload();

    if (refreshed) {
      acknowledgeMenuUpdate();
    }
  };

  const searchMenu = (query: string) => {
    setActiveCategory(query.trim() ? '' : 'all');
    onSearch(query);
  };

  const selectCategory = (category: (typeof CATEGORY_FILTERS)[number]) => {
    setActiveCategory(category.id);
    onCategoryChange(category.category);
  };

  return (
    <MenuLayout>
      <AccountBar />

      <section className={classes.Hero} aria-labelledby="menu-title">
        <div className={classes.HeroCopy}>
          <p className={classes.Kicker}>Sydney pickup and delivery</p>
          <h1 id="menu-title" className={classes.Title}>
            Burger Club
          </h1>
          <p className={classes.Subtitle}>
            Smashed burgers, loaded sides and cold drinks made for fast local
            ordering.
          </p>
        </div>

        <div className={classes.StoreCard}>
          <span className={classes.StatusDot} aria-hidden="true" />
          <div>
            <strong>Open today</strong>
            <span>Surry Hills pickup · 10:30 AM - 9:30 PM</span>
          </div>
        </div>
      </section>

      <div className={classes.MenuTools}>
        <FilterMeals onSearch={searchMenu} />
        <nav className={classes.CategoryRail} aria-label="Menu categories">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category.id}
              type="button"
              className={
                activeCategory === category.id ? classes.ActiveCategory : ''
              }
              onClick={() => selectCategory(category)}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </div>

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
