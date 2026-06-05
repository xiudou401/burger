import classes from './MenuFeedStatus.module.css';

interface MenuFeedStatusProps {
  hasMore: boolean;
  hasMeals: boolean;
  isLoading: boolean;
  error: string | null;
  hasMenuUpdate: boolean;
  onRefreshMenu: () => void;
  onRetry: () => void;
}

const MenuFeedStatus = ({
  hasMore,
  hasMeals,
  isLoading,
  error,
  hasMenuUpdate,
  onRefreshMenu,
  onRetry,
}: MenuFeedStatusProps) => {
  if (isLoading) {
    return (
      <div className={classes.LoadingStatus} role="status" aria-live="polite">
        <span className={classes.Spinner} aria-hidden="true" />
        Preparing the Sydney menu
      </div>
    );
  }

  if (error) {
    return (
      <button
        className={classes.ErrorStatus}
        type="button"
        onClick={onRetry}
        aria-live="polite"
      >
        {error}
      </button>
    );
  }

  if (hasMenuUpdate) {
    return (
      <button
        className={classes.RefreshStatus}
        type="button"
        onClick={onRefreshMenu}
        aria-live="polite"
      >
        Menu updated. Refresh for the latest items.
      </button>
    );
  }

  if (!hasMore && hasMeals) {
    return (
      <div className={classes.EndStatus} role="status">
        You have reached the end of today's menu.
      </div>
    );
  }

  return null;
};

export default MenuFeedStatus;
