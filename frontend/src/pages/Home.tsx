import { useCallback, useEffect, useState } from 'react';
import MenuItemsList from '../components/MenuItems/MenuItemsList';
import CartBar from '../components/Cart/CartBar';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import BrandHero from '../components/BrandHero/BrandHero';
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
  { id: 'all', label: 'All', shortLabel: 'All', category: undefined },
  ...MENU_CATEGORIES.map((category) => ({
    id: category.value,
    label: category.pluralLabel,
    shortLabel: category.shortPluralLabel,
    category: category.value,
  })),
] satisfies Array<{
  id: string;
  label: string;
  shortLabel: string;
  category?: MenuItemCategory;
}>;

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showMenuRefreshFallback, setShowMenuRefreshFallback] = useState(false);
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

  const refreshMenu = useCallback(async () => {
    const refreshed = await reload();

    if (refreshed) {
      acknowledgeMenuUpdate();
      setShowMenuRefreshFallback(false);
    } else {
      setShowMenuRefreshFallback(true);
    }
  }, [acknowledgeMenuUpdate, reload]);

  useEffect(() => {
    if (!hasMenuUpdate) {
      setShowMenuRefreshFallback(false);
      return;
    }

    let cancelled = false;

    setShowMenuRefreshFallback(false);

    const refreshChangedMenu = async () => {
      const refreshed = await reload();

      if (cancelled) return;

      if (refreshed) {
        acknowledgeMenuUpdate();
        setShowMenuRefreshFallback(false);
      } else {
        setShowMenuRefreshFallback(true);
      }
    };

    void refreshChangedMenu();

    return () => {
      cancelled = true;
    };
  }, [acknowledgeMenuUpdate, hasMenuUpdate, reload]);

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
      <BrandHero labelledBy="menu-title" className={classes.FixedHero} />

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
              <span className={classes.CategoryLabel}>{category.label}</span>
              <span className={classes.CategoryShortLabel}>
                {category.shortLabel}
              </span>
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
        hasMenuUpdate={showMenuRefreshFallback}
        onRefreshMenu={refreshMenu}
        onRetry={retry}
      />

      <CartBar />
    </MenuLayout>
  );
};

export default Home;
