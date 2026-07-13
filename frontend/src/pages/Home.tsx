import { useState } from 'react';
import MenuItemsList from '../components/MenuItems/MenuItemsList';
import Cart from '../components/Cart/Cart';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import AccountBar from '../components/Auth/AccountBar';
import MenuFeedStatus from '../components/Menu/MenuFeedStatus/MenuFeedStatus';
import MenuLayout from '../components/Menu/MenuLayout/MenuLayout';
import { fetchMenuItems } from '../api/menu-items';
import { useInfiniteMenuItems } from '../hooks/useInfiniteMenuItems';
import { useMenuRefreshPrompt } from './hooks/useMenuRefreshPrompt';
import { useCartSelector } from '../store/cart/hooks/useCartSelector';
import { MENU_CATEGORIES } from '../constants/menu-categories';
import type { MenuItemCategory } from '../types/menu-item';
import classes from './Home.module.css';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', category: undefined },
  ...MENU_CATEGORIES.map((category) => ({
    id: category.value,
    label: category.pluralLabel,
    category: category.value,
  })),
] satisfies Array<{
  id: string;
  label: string;
  category?: MenuItemCategory;
}>;

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const {
    menuItems,
    isLoading,
    error,
    hasMore,
    listRef,
    sentinelRef,
    onSearch,
    onCategoryChange,
    reload,
    retry,
  } = useInfiniteMenuItems({ fetchMenuItems, limit: 4 });

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
      <section className={classes.Hero} aria-labelledby="menu-title">
        <AccountBar variant="hero" />

        <div className={classes.HeroCopy}>
          <p className={classes.Kicker}>Made fresh in Surry Hills</p>
          <div className={classes.HeroLine}>
            <h1 id="menu-title" className={classes.Title}>
              Grillhouse burgers, loaded chips, thickshakes.
            </h1>
            <div className={classes.StoreStatus}>
              <span className={classes.StatusDot} aria-hidden="true" />
              <span>Open today · Surry Hills pickup · 10:30 AM - 9:30 PM</span>
            </div>
          </div>
        </div>
      </section>

      <div className={classes.MenuTools}>
        <MenuSearch onSearch={searchMenu} />
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

      <MenuItemsList
        menuItems={menuItems}
        ref={listRef}
        sentinelRef={sentinelRef}
      />

      <MenuFeedStatus
        hasMore={hasMore}
        hasMenuItems={menuItems.length > 0}
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
