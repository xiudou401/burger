import type { MenuItemCategory } from '../../../types/menu-item';
import classes from './MenuCategoryRail.module.css';

export interface MenuCategoryFilter {
  id: string;
  label: string;
  shortLabel: string;
  category?: MenuItemCategory;
}

interface MenuCategoryRailProps {
  categories: readonly MenuCategoryFilter[];
  activeCategory: string;
  onSelectCategory: (category: MenuCategoryFilter) => void;
}

const MenuCategoryRail = ({
  categories,
  activeCategory,
  onSelectCategory,
}: MenuCategoryRailProps) => {
  return (
    <nav className={classes.CategoryRail} aria-label="Menu categories">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={
            activeCategory === category.id ? classes.ActiveCategory : ''
          }
          onClick={() => onSelectCategory(category)}
        >
          <span className={classes.CategoryLabel}>{category.label}</span>
          <span className={classes.CategoryShortLabel}>
            {category.shortLabel}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default MenuCategoryRail;
