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
        正在准备菜单
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
        菜单已更新，点击刷新
      </button>
    );
  }

  if (!hasMore && hasMeals) {
    return (
      <div className={classes.EndStatus} role="status">
        今日菜单已经全部上桌
      </div>
    );
  }

  return null;
};

export default MenuFeedStatus;
