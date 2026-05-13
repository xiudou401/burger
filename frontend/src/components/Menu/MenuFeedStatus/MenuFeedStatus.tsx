import classes from './MenuFeedStatus.module.css';

interface MenuFeedStatusProps {
  hasMore: boolean;
  hasMeals: boolean;
  isLoading: boolean;
}

const MenuFeedStatus = ({
  hasMore,
  hasMeals,
  isLoading,
}: MenuFeedStatusProps) => {
  if (isLoading) {
    return (
      <div className={classes.LoadingStatus} role="status" aria-live="polite">
        <span className={classes.Spinner} aria-hidden="true" />
        正在准备菜单
      </div>
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
