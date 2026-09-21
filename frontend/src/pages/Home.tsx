import { useCallback, useEffect, useState } from 'react';
import MenuItemsList from '../components/MenuItems/MenuItemsList';
import CartBar from '../components/Cart/CartBar';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import BrandHero from '../components/BrandHero/BrandHero';
import MenuCategoryRail, {
  type MenuCategoryFilter,
} from '../components/Menu/MenuCategoryRail/MenuCategoryRail';
import MenuFeedStatus from '../components/Menu/MenuFeedStatus/MenuFeedStatus';
import MenuLayout from '../components/Menu/MenuLayout/MenuLayout';
import { fetchMenuItems } from '../api/menu-items';
import {
  type MenuLoadResult,
  useInfiniteMenuItems,
} from '../hooks/useInfiniteMenuItems';
import { useMenuRefreshPrompt } from './hooks/useMenuRefreshPrompt';
import { useCartSelector } from '../store/cart/hooks/useCartSelector';
import { MENU_CATEGORIES } from '../constants/menu-categories';
import classes from './Home.module.css';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', shortLabel: 'All', category: undefined },
  ...MENU_CATEGORIES.map((category) => ({
    id: category.value,
    label: category.pluralLabel,
    shortLabel: category.shortPluralLabel,
    category: category.value,
  })),
] satisfies MenuCategoryFilter[];

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showMenuRefreshFallback, setShowMenuRefreshFallback] = useState(false);
  const {
    menuItems,
    isLoading,
    error,
    listRef,
    sentinelRef,
    onSearch: searchMenuItems,
    onCategoryChange,
    reload,
    retry,
  } = useInfiniteMenuItems({ fetchMenuItems, limit: 4 });

  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const { hasMenuUpdate, acknowledgeMenuUpdate } =
    useMenuRefreshPrompt(menuVersion);

  const applyMenuReloadResult = useCallback(
    (result: MenuLoadResult) => {
      if (result === 'success') {
        acknowledgeMenuUpdate();
        setShowMenuRefreshFallback(false);
      } else if (result === 'failed') {
        setShowMenuRefreshFallback(true);
      }
    },
    [acknowledgeMenuUpdate],
  );

  const refreshMenu = useCallback(async () => {
    applyMenuReloadResult(await reload());
  }, [applyMenuReloadResult, reload]);

  useEffect(() => {
    if (!hasMenuUpdate) {
      setShowMenuRefreshFallback(false);
      return;
    }

    let cancelled = false;

    setShowMenuRefreshFallback(false);

    const refreshChangedMenu = async () => {
      const result = await reload();

      if (cancelled) return;

      applyMenuReloadResult(result);
    };

    void refreshChangedMenu();

    return () => {
      cancelled = true;
    };
  }, [applyMenuReloadResult, hasMenuUpdate, reload]);

  const handleMenuSearch = (query: string) => {
    setActiveCategory(query.trim() ? '' : 'all');
    searchMenuItems(query);
  };

  const selectCategory = (category: MenuCategoryFilter) => {
    setActiveCategory(category.id);
    onCategoryChange(category.category);
  };

  return (
    <MenuLayout>
      <BrandHero labelledBy="menu-title" className={classes.FixedHero} />

      <div className={classes.MenuTools}>
        <MenuSearch onSearch={handleMenuSearch} />
        <MenuCategoryRail
          categories={CATEGORY_FILTERS}
          activeCategory={activeCategory}
          onSelectCategory={selectCategory}
        />
      </div>

      <MenuItemsList
        menuItems={menuItems}
        ref={listRef}
        sentinelRef={sentinelRef}
      />

      <MenuFeedStatus
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
